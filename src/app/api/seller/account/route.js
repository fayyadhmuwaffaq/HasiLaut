import { NextResponse } from "next/server";
import { isForeignKeyRestrictError, query } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";
import { updateOwnAccountIdentity } from "@/lib/account-profile";

export async function PATCH(request) {
  const { user, error } = await requireApiRole(["seller"]);
  if (error) {
    return error;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format data akun tidak valid." },
      { status: 400 }
    );
  }

  try {
    const result = await updateOwnAccountIdentity({
      userId: user.id,
      role: "seller",
      body,
      includePhone: true,
    });

    if (!result.ok) {
      return NextResponse.json(
        result.fieldErrors
          ? { error: result.error, fieldErrors: result.fieldErrors }
          : { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        message: "Identitas akun Mitra Nelayan berhasil diperbarui.",
        user: result.user,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH /api/seller/account error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui identitas akun." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const { user, error } = await requireApiRole(["seller"]);
  if (error) {
    return error;
  }

  if (user.seller_status !== "rejected") {
    return NextResponse.json(
      { error: "Hanya akun mitra berstatus ditolak yang dapat dihapus melalui halaman ini." },
      { status: 403 }
    );
  }

  try {
    const result = await query(
      `DELETE FROM users
       WHERE id = $1 AND role = 'seller' AND seller_status = 'rejected'
       RETURNING id`,
      [user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau status sudah berubah." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Akun mitra telah dihapus." },
      { status: 200 }
    );
  } catch (err) {
    if (isForeignKeyRestrictError(err)) {
      return NextResponse.json(
        { error: "Akun tidak dapat dihapus karena masih memiliki riwayat pesanan." },
        { status: 409 }
      );
    }

    console.error("Delete rejected seller account error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus akun. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
