import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";
import { formatKg } from "@/lib/format";

class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function generateOrderCode() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `HL-${yyyy}${mm}${dd}-${suffix}`;
}

function formatAddressSnapshot(addr) {
  const postal = addr.postal_code ? ` ${addr.postal_code}` : "";
  return `[${addr.label}] ${addr.recipient_name} (${addr.recipient_phone})\n${addr.full_address}, ${addr.city}${postal}`;
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
      { error: "Format data checkout tidak valid." },
      { status: 400 }
    );
  }

  const addressId = Number(body?.addressId);
  const paymentMethod =
    body?.paymentMethod === "cod" || body?.paymentMethod === "bank_transfer"
      ? body.paymentMethod
      : "";

  if (!Number.isInteger(addressId) || addressId <= 0) {
    return NextResponse.json(
      { error: "Pilih alamat pengiriman terlebih dahulu." },
      { status: 400 }
    );
  }

  if (!paymentMethod) {
    return NextResponse.json(
      { error: "Pilih metode pembayaran COD atau Transfer Bank Manual." },
      { status: 400 }
    );
  }

  try {
    const createdOrders = await withTransaction(async (client) => {
      const addrRes = await client.query(
        `SELECT id, label, recipient_name, recipient_phone, full_address, city, postal_code
         FROM user_addresses
         WHERE id = $1 AND user_id = $2
         LIMIT 1`,
        [addressId, user.id]
      );
      const address = addrRes.rows[0];
      if (!address) {
        throw new CheckoutError("Alamat pengiriman tidak ditemukan.", 404);
      }

      const cartRes = await client.query(
        `SELECT id FROM carts WHERE buyer_id = $1 LIMIT 1`,
        [user.id]
      );
      const cart = cartRes.rows[0];
      if (!cart) {
        throw new CheckoutError("Keranjang belanja masih kosong.", 400);
      }

      // Lock products in deterministic order (store_id, product_id) to prevent deadlocks.
      const itemsRes = await client.query(
        `SELECT
           ci.id AS cart_item_id,
           ci.product_id,
           ci.quantity_kg,
           p.store_id,
           p.name AS product_name,
           p.price_per_kg,
           p.stock_kg,
           p.is_active,
           s.store_name,
           u.seller_status
         FROM cart_items ci
         INNER JOIN products p ON p.id = ci.product_id
         INNER JOIN stores s ON s.id = p.store_id
         INNER JOIN users u ON u.id = s.seller_id
         WHERE ci.cart_id = $1
         ORDER BY p.store_id ASC, p.id ASC
         FOR UPDATE OF p, ci`,
        [cart.id]
      );

      if (itemsRes.rowCount === 0) {
        throw new CheckoutError("Keranjang belanja masih kosong.", 400);
      }

      const itemsByStore = new Map();

      for (const row of itemsRes.rows) {
        if (row.seller_status !== "approved") {
          throw new CheckoutError(
            `Lapak untuk produk "${row.product_name}" sedang tidak aktif.`,
            400
          );
        }

        if (!row.is_active) {
          throw new CheckoutError(
            `Produk "${row.product_name}" sedang dinonaktifkan oleh penjual.`,
            400
          );
        }

        const requestedKg = Number(row.quantity_kg);
        const availableKg = Number(row.stock_kg);
        if (requestedKg < 0.5) {
          throw new CheckoutError(
            `Jumlah "${row.product_name}" minimal 0,5 kg.`,
            400
          );
        }
        if (availableKg < requestedKg) {
          throw new CheckoutError(
            `Stok "${row.product_name}" tidak mencukupi (tersisa ${formatKg(availableKg)}).`,
            400
          );
        }

        const group = itemsByStore.get(row.store_id) || {
          storeId: row.store_id,
          storeName: row.store_name,
          items: [],
        };
        group.items.push(row);
        itemsByStore.set(row.store_id, group);
      }

      const shippingSnapshot = formatAddressSnapshot(address);
      const ordersOutput = [];

      for (const group of itemsByStore.values()) {
        const preparedItems = group.items.map((item) => {
          const pricePerKg = Number(item.price_per_kg);
          const quantityKg = Number(item.quantity_kg);
          const subtotal = Math.round(pricePerKg * quantityKg * 100) / 100;
          return {
            productId: item.product_id,
            productName: item.product_name,
            pricePerKg,
            quantityKg,
            subtotal,
          };
        });

        const totalAmount =
          Math.round(
            preparedItems.reduce((sum, item) => sum + item.subtotal, 0) * 100
          ) / 100;

        const orderRes = await client.query(
          `INSERT INTO orders (
             order_code, buyer_id, store_id, shipping_address_snapshot,
             payment_method, total_amount, status
           )
           VALUES ($1, $2, $3, $4, $5, $6, 'pending_payment')
           RETURNING id, order_code, store_id, payment_method, total_amount, status, created_at`,
          [
            generateOrderCode(),
            user.id,
            group.storeId,
            shippingSnapshot,
            paymentMethod,
            totalAmount,
          ]
        );
        const order = orderRes.rows[0];

        for (const item of preparedItems) {
          await client.query(
            `INSERT INTO order_items (
               order_id, product_id, product_name_snapshot,
               price_per_kg_snapshot, quantity_kg, subtotal
             )
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              order.id,
              item.productId,
              item.productName,
              item.pricePerKg,
              item.quantityKg,
              item.subtotal,
            ]
          );

          const stockUpdate = await client.query(
            `UPDATE products
             SET stock_kg = stock_kg - $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND stock_kg >= $1
             RETURNING stock_kg`,
            [item.quantityKg, item.productId]
          );

          if (stockUpdate.rowCount === 0) {
            throw new CheckoutError(
              `Stok "${item.productName}" tidak mencukupi.`,
              409
            );
          }
        }

        ordersOutput.push({
          ...order,
          total_amount: Number(order.total_amount),
          store_name: group.storeName,
          items: preparedItems,
        });
      }

      await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [
        cart.id,
      ]);
      await client.query(
        `UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [cart.id]
      );

      return ordersOutput;
    });

    return NextResponse.json(
      {
        message: `${createdOrders.length} pesanan berhasil dibuat.`,
        orders: createdOrders,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error("POST /api/buyer/checkout error:", err);
    return NextResponse.json(
      { error: "Gagal memproses checkout pesanan." },
      { status: 500 }
    );
  }
}
