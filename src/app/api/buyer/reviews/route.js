import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";

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
      { error: "Format data ulasan tidak valid." },
      { status: 400 }
    );
  }

  const orderItemId = Number(body?.orderItemId);
  const rating = Number(body?.rating);
  const comment =
    typeof body?.comment === "string" ? body.comment.trim() : "";

  if (!Number.isInteger(orderItemId) || orderItemId <= 0) {
    return NextResponse.json(
      { error: "Item pesanan tidak valid." },
      { status: 400 }
    );
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating harus berupa angka bulat antara 1 sampai 5." },
      { status: 400 }
    );
  }

  if (comment.length > 1000) {
    return NextResponse.json(
      { error: "Ulasan maksimal 1000 karakter." },
      { status: 400 }
    );
  }

  try {
    const itemRes = await query(
      `SELECT oi.id, oi.product_id, o.status
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE oi.id = $1 AND o.buyer_id = $2
       LIMIT 1`,
      [orderItemId, user.id]
    );

    const item = itemRes.rows[0];
    if (!item) {
      return NextResponse.json(
        { error: "Item pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (item.status !== "completed") {
      return NextResponse.json(
        { error: "Ulasan hanya dapat diberikan setelah pesanan selesai." },
        { status: 400 }
      );
    }

    const insertRes = await query(
      `INSERT INTO reviews (order_item_id, buyer_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, order_item_id, product_id, rating, comment, created_at`,
      [item.id, user.id, item.product_id, rating, comment || null]
    );

    return NextResponse.json(
      {
        message: "Terima kasih, ulasan Anda telah dipublikasikan.",
        review: insertRes.rows[0],
      },
      { status: 201 }
    );
  } catch (err) {
    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "Item pesanan ini sudah pernah Anda ulas." },
        { status: 409 }
      );
    }

    console.error("POST /api/buyer/reviews error:", err);
    return NextResponse.json(
      { error: "Gagal mengirim ulasan." },
      { status: 500 }
    );
  }
}
