import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";

class CompleteOrderError extends Error {
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
    const completed = await withTransaction(async (client) => {
      const orderRes = await client.query(
        `SELECT id, order_code, status
         FROM orders
         WHERE id = $1 AND buyer_id = $2
         FOR UPDATE`,
        [orderId, user.id]
      );

      const order = orderRes.rows[0];
      if (!order) {
        throw new CompleteOrderError("Pesanan tidak ditemukan.", 404);
      }

      if (order.status !== "shipped") {
        throw new CompleteOrderError(
          "Hanya pesanan berstatus Dikirim yang dapat dikonfirmasi diterima.",
          400
        );
      }

      const updateRes = await client.query(
        `UPDATE orders
         SET status = 'completed',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, order_code, status, updated_at`,
        [order.id]
      );

      return updateRes.rows[0];
    });

    return NextResponse.json(
      {
        message: `Pesanan ${completed.order_code} dikonfirmasi diterima dan selesai.`,
        order: completed,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof CompleteOrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error("POST /api/buyer/orders/[id]/complete error:", err);
    return NextResponse.json(
      { error: "Gagal menyelesaikan pesanan." },
      { status: 500 }
    );
  }
}
