import { NextResponse } from "next/server";
import { isForeignKeyRestrictError, query } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";

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
