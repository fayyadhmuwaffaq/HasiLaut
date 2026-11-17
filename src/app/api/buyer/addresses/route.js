import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";
import { getBuyerAddresses } from "@/lib/queries/buyer";

function validateAddressPayload(body) {
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const recipientName =
    typeof body?.recipient_name === "string" ? body.recipient_name.trim() : "";
  const recipientPhone =
    typeof body?.recipient_phone === "string"
      ? body.recipient_phone.trim()
      : "";
  const fullAddress =
    typeof body?.full_address === "string" ? body.full_address.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const postalCode =
    typeof body?.postal_code === "string" ? body.postal_code.trim() : "";
  const isDefault = Boolean(body?.is_default);

  const fieldErrors = {};

  if (!label || label.length > 50) {
    fieldErrors.label = "Label alamat wajib diisi (maksimal 50 karakter).";
  }
  if (recipientName.length < 2 || recipientName.length > 100) {
    fieldErrors.recipient_name =
      "Nama penerima wajib diisi (2 sampai 100 karakter).";
  }
  if (recipientPhone.length < 6 || recipientPhone.length > 20) {
    fieldErrors.recipient_phone =
      "Nomor telepon penerima wajib diisi (6 sampai 20 karakter).";
  }
  if (fullAddress.length < 5) {
    fieldErrors.full_address = "Alamat lengkap wajib diisi minimal 5 karakter.";
  }
  if (city.length < 2 || city.length > 100) {
    fieldErrors.city = "Nama kota atau kabupaten wajib diisi.";
  }
  if (postalCode.length > 10) {
    fieldErrors.postal_code = "Kode pos maksimal 10 karakter.";
  }

  return {
    fieldErrors,
    cleaned: {
      label,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      full_address: fullAddress,
      city,
      postal_code: postalCode || null,
      is_default: isDefault,
    },
  };
}

export async function GET() {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  try {
    const addresses = await getBuyerAddresses(user.id);
    return NextResponse.json({ addresses }, { status: 200 });
  } catch (err) {
    console.error("GET /api/buyer/addresses error:", err);
    return NextResponse.json(
      { error: "Gagal memuat daftar alamat." },
      { status: 500 }
    );
  }
}

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
      { error: "Format data alamat tidak valid." },
      { status: 400 }
    );
  }

  const { fieldErrors, cleaned } = validateAddressPayload(body);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: "Periksa kembali rincian alamat pengiriman.", fieldErrors },
      { status: 400 }
    );
  }

  try {
    const address = await withTransaction(async (client) => {
      const existingCountRes = await client.query(
        `SELECT COUNT(*)::int AS count FROM user_addresses WHERE user_id = $1`,
        [user.id]
      );
      const makeDefault =
        cleaned.is_default || existingCountRes.rows[0].count === 0;

      if (makeDefault) {
        await client.query(
          `UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`,
          [user.id]
        );
      }

      const inserted = await client.query(
        `INSERT INTO user_addresses (
           user_id, label, recipient_name, recipient_phone,
           full_address, city, postal_code, is_default
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, label, recipient_name, recipient_phone, full_address, city, postal_code, is_default, created_at`,
        [
          user.id,
          cleaned.label,
          cleaned.recipient_name,
          cleaned.recipient_phone,
          cleaned.full_address,
          cleaned.city,
          cleaned.postal_code,
          makeDefault,
        ]
      );

      return inserted.rows[0];
    });

    return NextResponse.json(
      { message: "Alamat berhasil disimpan.", address },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/buyer/addresses error:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan alamat pengiriman." },
      { status: 500 }
    );
  }
}
