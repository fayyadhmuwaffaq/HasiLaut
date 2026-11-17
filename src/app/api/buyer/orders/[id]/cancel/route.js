import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";

class CancelOrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function POST(_request, context) {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const orderId = Number(rawId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json(
      { error: "ID pesanan tidak valid." },
      { status: 400 }
    );
  }

  try {
    const cancelled = await withTransaction(async (client) => {
      const orderRes = await client.query(
        `SELECT id, order_code, status
         FROM orders
         WHERE id = $1 AND buyer_id = $2
         FOR UPDATE`,
        [orderId, user.id]
      );

      const order = orderRes.rows[0];
      if (!order) {
        throw new CancelOrderError("Pesanan tidak ditemukan.", 404);
      }

      if (order.status !== "pending_payment") {
        throw new CancelOrderError(
          "Hanya pesanan berstatus Menunggu Pembayaran yang dapat dibatalkan.",
          400
        );
      }

      const itemsRes = await client.query(
        `SELECT product_id, quantity_kg
         FROM order_items
         WHERE order_id = $1
         ORDER BY product_id ASC`,
        [order.id]
      );

      for (const item of itemsRes.rows) {
        await client.query(
          `UPDATE products
           SET stock_kg = stock_kg + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [item.quantity_kg, item.product_id]
        );
      }

      const updateRes = await client.query(
        `UPDATE orders
         SET status = 'cancelled',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, order_code, status, updated_at`,
        [order.id]
      );

      return updateRes.rows[0];
    });

    return NextResponse.json(
      {
        message: `Pesanan ${cancelled.order_code} telah dibatalkan.`,
        order: cancelled,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof CancelOrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error("POST /api/buyer/orders/[id]/cancel error:", err);
    return NextResponse.json(
      { error: "Gagal membatalkan pesanan." },
      { status: 500 }
    );
  }
}
