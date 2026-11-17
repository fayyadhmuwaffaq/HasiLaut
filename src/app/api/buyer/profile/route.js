import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";

export async function GET() {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  return NextResponse.json(
    {
      profile: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number || "",
      },
    },
    { status: 200 }
  );
}

export async function PATCH(request) {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format data profil tidak valid." },
      { status: 400 }
    );
  }

  const fullName =
    typeof body?.full_name === "string" ? body.full_name.trim() : "";
  const phoneNumber =
    typeof body?.phone_number === "string" ? body.phone_number.trim() : "";

  if (fullName.length < 2 || fullName.length > 100) {
    return NextResponse.json(
      { error: "Nama lengkap wajib diisi (2 sampai 100 karakter)." },
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
    const result = await query(
      `UPDATE users
       SET full_name = $1,
           phone_number = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND role = 'buyer'
       RETURNING id, full_name, email, phone_number`,
      [fullName, phoneNumber || null, user.id]
    );

    return NextResponse.json(
      { message: "Profil berhasil diperbarui.", profile: result.rows[0] },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH /api/buyer/profile error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui profil." },
      { status: 500 }
    );
  }
}
