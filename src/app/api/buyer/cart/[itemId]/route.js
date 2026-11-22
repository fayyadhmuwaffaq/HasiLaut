import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";
import { formatKg, parseQuantityKg } from "@/lib/format";

class CartItemError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function PATCH(request, context) {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  const { itemId: rawItemId } = await context.params;
  const itemId = Number(rawItemId);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json(
      { error: "Item keranjang tidak valid." },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format pembaruan jumlah tidak valid." },
      { status: 400 }
    );
  }

  const quantityKg = parseQuantityKg(body?.quantityKg);
  if (quantityKg === null) {
    return NextResponse.json(
      { error: "Jumlah pembelian minimal 0,5 kg." },
      { status: 400 }
    );
  }

  try {
    const updated = await withTransaction(async (client) => {
      const itemRes = await client.query(
        `SELECT
           ci.id,
           ci.cart_id,
           ci.product_id,
           p.name AS product_name,
           p.stock_kg,
           p.price_per_kg,
           p.is_active,
           u.seller_status
         FROM cart_items ci
         INNER JOIN carts c ON c.id = ci.cart_id
         INNER JOIN products p ON p.id = ci.product_id
         INNER JOIN stores s ON s.id = p.store_id
         INNER JOIN users u ON u.id = s.seller_id
         WHERE ci.id = $1 AND c.buyer_id = $2
         FOR UPDATE OF ci, p`,
        [itemId, user.id]
      );

      const item = itemRes.rows[0];
      if (!item) {
        throw new CartItemError("Item keranjang tidak ditemukan.", 404);
      }

      if (item.seller_status !== "approved" || !item.is_active) {
        throw new CartItemError(
          item.seller_status !== "approved"
            ? "Produk dari lapak ini sedang tidak tersedia."
            : "Produk sedang dinonaktifkan oleh penjual.",
          400
        );
      }

      const availableStock = Number(item.stock_kg);
      if (quantityKg > availableStock) {
        throw new CartItemError(
          `Stok ${item.product_name} tersisa ${formatKg(availableStock)}.`,
          400
        );
      }

      await client.query(
        `UPDATE cart_items SET quantity_kg = $1 WHERE id = $2`,
        [quantityKg, item.id]
      );

      await client.query(
        `UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [item.cart_id]
      );

      return {
        id: item.id,
        quantity_kg: quantityKg,
        subtotal: Math.round(Number(item.price_per_kg) * quantityKg * 100) / 100,
      };
    });

    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (err) {
    if (err instanceof CartItemError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error("PATCH /api/buyer/cart/[itemId] error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui jumlah item." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  const { itemId: rawItemId } = await context.params;
  const itemId = Number(rawItemId);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json(
      { error: "Item keranjang tidak valid." },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `DELETE FROM cart_items ci
       USING carts c
       WHERE ci.id = $1 AND ci.cart_id = c.id AND c.buyer_id = $2
       RETURNING ci.id`,
      [itemId, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Item keranjang tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Item dihapus dari keranjang." },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/buyer/cart/[itemId] error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus item dari keranjang." },
      { status: 500 }
    );
  }
}
