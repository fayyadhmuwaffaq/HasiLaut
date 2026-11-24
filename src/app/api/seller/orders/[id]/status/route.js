import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireApiApprovedSeller } from "@/lib/auth-guards";

const ALLOWED_TRANSITIONS = {
  pending_payment: new Set(["processing", "cancelled"]),
  processing: new Set(["shipped"]),
  shipped: new Set(),
  completed: new Set(),
  cancelled: new Set(),
};

class OrderTransitionError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function PATCH(request, context) {
  const { store, error } = await requireApiApprovedSeller();
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format pembaruan status tidak valid." },
      { status: 400 }
    );
  }

  const nextStatus =
    typeof body?.nextStatus === "string" ? body.nextStatus.trim() : "";

  try {
    const updatedOrder = await withTransaction(async (client) => {
      const orderRes = await client.query(
        `SELECT id, order_code, status
         FROM orders
         WHERE id = $1 AND store_id = $2
         FOR UPDATE`,
        [orderId, store.id]
      );

      const order = orderRes.rows[0];
      if (!order) {
        throw new OrderTransitionError(
          "Pesanan tidak ditemukan untuk lapak Anda.",
          404
        );
      }

      if (order.status === "shipped" && nextStatus === "completed") {
        throw new OrderTransitionError(
          "Konfirmasi penyelesaian pesanan hanya dapat dilakukan oleh pembeli setelah barang diterima.",
          403
        );
      }

      const allowedNext = ALLOWED_TRANSITIONS[order.status];
      if (!allowedNext || !allowedNext.has(nextStatus)) {
        throw new OrderTransitionError(
          "Perubahan status pesanan tidak sesuai urutan yang diizinkan.",
          400
        );
      }

      if (nextStatus === "cancelled") {
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
      }

      const updateRes = await client.query(
        `UPDATE orders
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND store_id = $3
         RETURNING id, order_code, status, updated_at`,
        [nextStatus, order.id, store.id]
      );

      return updateRes.rows[0];
    });

    return NextResponse.json(
      {
        message: `Status pesanan ${updatedOrder.order_code} diperbarui.`,
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof OrderTransitionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error("PATCH /api/seller/orders/[id]/status error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui status pesanan." },
      { status: 500 }
    );
  }
}
