import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";
import { formatKg, parseQuantityKg } from "@/lib/format";

class CartActionError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function roundKg(val) {
  return Math.round(val * 100) / 100;
}

export async function GET() {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  try {
    const data = await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO carts (buyer_id)
         VALUES ($1)
         ON CONFLICT (buyer_id) DO NOTHING`,
        [user.id]
      );

      const cartRes = await client.query(
        `SELECT id FROM carts WHERE buyer_id = $1 LIMIT 1`,
        [user.id]
      );
      const cartId = cartRes.rows[0].id;

      const itemsRes = await client.query(
        `SELECT
           ci.id,
           ci.product_id,
           ci.quantity_kg,
           p.name AS product_name,
           p.price_per_kg,
           p.stock_kg,
           p.is_active,
           p.image_url,
           s.id AS store_id,
           s.store_name,
           s.dock_location,
           u.seller_status
         FROM cart_items ci
         INNER JOIN products p ON p.id = ci.product_id
         INNER JOIN stores s ON s.id = p.store_id
         INNER JOIN users u ON u.id = s.seller_id
         WHERE ci.cart_id = $1
         ORDER BY s.store_name ASC, ci.created_at ASC, ci.id ASC`,
        [cartId]
      );

      const items = itemsRes.rows.map((row) => {
        const pricePerKg = Number(row.price_per_kg);
        const quantityKg = Number(row.quantity_kg);
        const stockKg = Number(row.stock_kg);
        return {
          ...row,
          price_per_kg: pricePerKg,
          quantity_kg: quantityKg,
          stock_kg: stockKg,
          subtotal: Math.round(pricePerKg * quantityKg * 100) / 100,
          is_available:
            row.seller_status === "approved" &&
            row.is_active !== false &&
            stockKg >= quantityKg,
        };
      });

      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        cartId,
        items,
        totalAmount: Math.round(totalAmount * 100) / 100,
      };
    });

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("GET /api/buyer/cart error:", err);
    return NextResponse.json(
      { error: "Gagal memuat isi keranjang." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan keranjang tidak valid." },
      { status: 400 }
    );
  }

  const productId = Number(body?.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json(
      { error: "Produk yang dipilih tidak valid." },
      { status: 400 }
    );
  }

  const requestedKg = parseQuantityKg(body?.quantityKg);
  if (requestedKg === null) {
    return NextResponse.json(
      { error: "Jumlah pembelian minimal 0,5 kg." },
      { status: 400 }
    );
  }

  try {
    const result = await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO carts (buyer_id)
         VALUES ($1)
         ON CONFLICT (buyer_id) DO NOTHING`,
        [user.id]
      );

      const cartRes = await client.query(
        `SELECT id FROM carts WHERE buyer_id = $1 LIMIT 1`,
        [user.id]
      );
      const cartId = cartRes.rows[0].id;

      const productRes = await client.query(
        `SELECT p.id, p.name, p.stock_kg, p.price_per_kg, p.is_active, u.seller_status
         FROM products p
         INNER JOIN stores s ON s.id = p.store_id
         INNER JOIN users u ON u.id = s.seller_id
         WHERE p.id = $1
         FOR UPDATE OF p`,
        [productId]
      );

      const product = productRes.rows[0];
      if (!product || product.seller_status !== "approved") {
        throw new CartActionError(
          "Produk tidak ditemukan atau belum tersedia untuk dibeli.",
          404
        );
      }

      if (!product.is_active) {
        throw new CartActionError(
          "Produk sedang dinonaktifkan oleh penjual.",
          400
        );
      }

      const availableStock = Number(product.stock_kg);
      if (availableStock < 0.5) {
        throw new CartActionError("Stok produk sedang habis.", 400);
      }

      const existingRes = await client.query(
        `SELECT quantity_kg
         FROM cart_items
         WHERE cart_id = $1 AND product_id = $2
         FOR UPDATE`,
        [cartId, productId]
      );

      const existingQty = existingRes.rows[0]
        ? Number(existingRes.rows[0].quantity_kg)
        : 0;
      const nextQty = roundKg(existingQty + requestedKg);

      if (nextQty > availableStock) {
        throw new CartActionError(
          `Jumlah melebihi sisa stok (${formatKg(availableStock)}). Di keranjang sudah ada ${formatKg(existingQty)}.`,
          400
        );
      }

      const upsertRes = await client.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity_kg)
         VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, product_id) DO UPDATE
           SET quantity_kg = $3
         RETURNING id, product_id, quantity_kg`,
        [cartId, productId, nextQty]
      );

      await client.query(
        `UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [cartId]
      );

      const countRes = await client.query(
        `SELECT COUNT(*)::int AS count FROM cart_items WHERE cart_id = $1`,
        [cartId]
      );

      return {
        message: `${product.name} ditambahkan ke keranjang`,
        item: upsertRes.rows[0],
        cartCount: countRes.rows[0]?.count ?? 0,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof CartActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error("POST /api/buyer/cart error:", err);
    return NextResponse.json(
      { error: "Gagal menambahkan produk ke keranjang." },
      { status: 500 }
    );
  }
}
