import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";

export async function PATCH(request, context) {
  const { error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const sellerId = Number(rawId);
  if (!Number.isInteger(sellerId) || sellerId <= 0) {
    return NextResponse.json(
      { error: "ID mitra seller tidak valid." },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format verifikasi seller tidak valid." },
      { status: 400 }
    );
  }

  const nextStatus =
    body?.status === "approved" || body?.status === "rejected"
      ? body.status
      : "";
  if (!nextStatus) {
    return NextResponse.json(
      { error: "Status verifikasi harus bernilai approved atau rejected." },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `UPDATE users
       SET seller_status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = 'seller'
       RETURNING id, full_name, email, role, seller_status`,
      [nextStatus, sellerId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Akun mitra seller tidak ditemukan." },
        { status: 404 }
      );
    }

    const updated = result.rows[0];
    return NextResponse.json(
      {
        message:
          nextStatus === "approved"
            ? `Akun ${updated.full_name} telah disetujui.`
            : `Akun ${updated.full_name} telah ditolak.`,
        seller: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH /api/admin/sellers/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui status verifikasi seller." },
      { status: 500 }
    );
  }
}
