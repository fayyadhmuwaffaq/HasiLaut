import { NextResponse } from "next/server";
import { isForeignKeyRestrictError, query } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request, context) {
  const { error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const targetId = Number(rawId);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json(
      { error: "ID pengguna tidak valid." },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format data pengguna tidak valid." },
      { status: 400 }
    );
  }

  const fullName =
    typeof body?.full_name === "string" ? body.full_name.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phoneNumber =
    typeof body?.phone_number === "string" ? body.phone_number.trim() : "";

  if (fullName.length < 2 || fullName.length > 100) {
    return NextResponse.json(
      { error: "Nama lengkap wajib diisi (2 sampai 100 karakter)." },
      { status: 400 }
    );
  }

  if (!email || email.length > 120 || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Alamat email tidak valid (maksimal 120 karakter)." },
      { status: 400 }
    );
  }

  if (phoneNumber.length > 20) {
    return NextResponse.json(
      { error: "Nomor telepon maksimal 20 karakter." },
      { status: 400 }
    );
  }

  try {
    const updated = await query(
      `UPDATE users
       SET full_name = $1,
           email = $2,
           phone_number = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, full_name, email, phone_number, role, seller_status, created_at`,
      [fullName, email, phoneNumber || null, targetId]
    );

    if (updated.rowCount === 0) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Data pengguna berhasil diperbarui.", user: updated.rows[0] },
      { status: 200 }
    );
  } catch (err) {
    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "Email tersebut sudah digunakan oleh akun lain." },
        { status: 409 }
      );
    }

    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui data pengguna." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { user: currentAdmin, error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const targetId = Number(rawId);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json(
      { error: "ID pengguna tidak valid." },
      { status: 400 }
    );
  }

  if (targetId === currentAdmin.id) {
    return NextResponse.json(
      { error: "Anda tidak dapat menghapus akun Admin yang sedang aktif." },
      { status: 400 }
    );
  }

  try {
    const deleted = await query(
      `DELETE FROM users
       WHERE id = $1 AND id <> $2
       RETURNING id, full_name`,
      [targetId, currentAdmin.id]
    );

    if (deleted.rowCount === 0) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan atau tidak dapat dihapus." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `Akun "${deleted.rows[0].full_name}" telah dihapus.` },
      { status: 200 }
    );
  } catch (err) {
    if (isForeignKeyRestrictError(err)) {
      return NextResponse.json(
        {
          error:
            "Pengguna atau lapak ini sudah memiliki riwayat pesanan sehingga tidak dapat dihapus permanen.",
        },
        { status: 409 }
      );
    }

    console.error("DELETE /api/admin/users/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus pengguna." },
      { status: 500 }
    );
  }
}
