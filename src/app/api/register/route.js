import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";

const SALT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format data registrasi tidak valid." },
      { status: 400 }
    );
  }

  const fullName =
    typeof body?.full_name === "string" ? body.full_name.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const phoneNumber =
    typeof body?.phone_number === "string" ? body.phone_number.trim() : "";
  const role = body?.role === "seller" ? "seller" : body?.role === "buyer" ? "buyer" : "";
  const storeName =
    typeof body?.store_name === "string" ? body.store_name.trim() : "";
  const dockLocation =
    typeof body?.dock_location === "string" ? body.dock_location.trim() : "";

  const fieldErrors = {};

  if (!fullName || fullName.length < 2 || fullName.length > 100) {
    fieldErrors.full_name = "Nama lengkap wajib diisi (2 sampai 100 karakter).";
  }

  if (!email || email.length > 120 || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Masukkan alamat email yang valid (maksimal 120 karakter).";
  }

  if (!password || password.length < 8) {
    fieldErrors.password = "Kata sandi minimal 8 karakter.";
  }

  if (phoneNumber.length > 20) {
    fieldErrors.phone_number = "Nomor telepon maksimal 20 karakter.";
  }

  if (!role) {
    fieldErrors.role = "Pilih jenis akun Pembeli atau Mitra Nelayan.";
  }

  if (role === "seller") {
    if (!storeName || storeName.length < 2 || storeName.length > 100) {
      fieldErrors.store_name =
        "Nama lapak atau toko wajib diisi (2 sampai 100 karakter).";
    }
    if (dockLocation.length > 150) {
      fieldErrors.dock_location = "Lokasi dermaga maksimal 150 karakter.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: "Periksa kembali data pendaftaran Anda.", fieldErrors },
      { status: 400 }
    );
  }

  try {
    const existing = await query(
      `SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );
    if (existing.rowCount > 0) {
      return NextResponse.json(
        {
          error: "Email ini sudah terdaftar. Gunakan email lain atau silakan masuk.",
          fieldErrors: { email: "Email sudah terdaftar." },
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const sellerStatus = role === "seller" ? "pending" : null;

    const createdUser = await withTransaction(async (client) => {
      const userRes = await client.query(
        `INSERT INTO users (full_name, email, password_hash, phone_number, role, seller_status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, full_name, email, role, seller_status`,
        [
          fullName,
          email,
          passwordHash,
          phoneNumber || null,
          role,
          sellerStatus,
        ]
      );
      const user = userRes.rows[0];

      if (role === "buyer") {
        await client.query(`INSERT INTO carts (buyer_id) VALUES ($1)`, [
          user.id,
        ]);
      } else {
        await client.query(
          `INSERT INTO stores (seller_id, store_name, dock_location)
           VALUES ($1, $2, $3)`,
          [user.id, storeName, dockLocation || null]
        );
      }

      return user;
    });

    return NextResponse.json(
      {
        message: "Pendaftaran berhasil.",
        user: createdUser,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error?.code === "23505") {
      return NextResponse.json(
        {
          error: "Email ini sudah terdaftar. Gunakan email lain atau silakan masuk.",
          fieldErrors: { email: "Email sudah terdaftar." },
        },
        { status: 409 }
      );
    }

    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pendaftaran. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
