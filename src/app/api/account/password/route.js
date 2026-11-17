import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query } from "@/lib/db";
import { requireApiAuth } from "@/lib/auth-guards";

const SALT_ROUNDS = 12;

export async function POST(request) {
  const { user, error } = await requireApiAuth();
  if (error) {
    return error;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid." },
      { status: 400 }
    );
  }

  const currentPassword =
    typeof body?.current_password === "string" ? body.current_password : "";
  const newPassword =
    typeof body?.new_password === "string" ? body.new_password : "";
  const confirmPassword =
    typeof body?.confirm_password === "string" ? body.confirm_password : "";

  const fieldErrors = {};

  if (!currentPassword) {
    fieldErrors.current_password = "Masukkan kata sandi saat ini.";
  }

  if (!newPassword || newPassword.length < 8) {
    fieldErrors.new_password = "Kata sandi baru minimal 8 karakter.";
  } else if (newPassword.length > 128) {
    fieldErrors.new_password = "Kata sandi baru maksimal 128 karakter.";
  } else if (currentPassword && newPassword === currentPassword) {
    fieldErrors.new_password =
      "Kata sandi baru harus berbeda dari kata sandi saat ini.";
  }

  if (confirmPassword !== newPassword) {
    fieldErrors.confirm_password = "Konfirmasi kata sandi tidak cocok.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    const firstError = Object.values(fieldErrors)[0];
    return NextResponse.json(
      { error: firstError, fieldErrors },
      { status: 400 }
    );
  }

  try {
    const existing = await query(
      `SELECT id, password_hash
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    const dbUser = existing.rows[0];
    if (!dbUser) {
      return NextResponse.json(
        { error: "Akun pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const isCurrentValid = await bcrypt.compare(
      currentPassword,
      dbUser.password_hash
    );
    if (!isCurrentValid) {
      return NextResponse.json(
        {
          error: "Kata sandi saat ini tidak sesuai.",
          fieldErrors: {
            current_password: "Kata sandi saat ini tidak sesuai.",
          },
        },
        { status: 400 }
      );
    }

    const nextHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query(
      `UPDATE users
       SET password_hash = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [nextHash, user.id]
    );

    return NextResponse.json(
      {
        message:
          "Kata sandi berhasil diperbarui. Sesi aktif tetap berjalan dan gunakan kata sandi baru saat masuk berikutnya.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/account/password error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui kata sandi." },
      { status: 500 }
    );
  }
}
