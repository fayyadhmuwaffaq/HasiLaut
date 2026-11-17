import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";

class AddressNotFoundError extends Error {}

export async function PATCH(request, context) {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const addressId = Number(rawId);
  if (!Number.isInteger(addressId) || addressId <= 0) {
    return NextResponse.json(
      { error: "ID alamat tidak valid." },
      { status: 400 }
    );
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

  const setDefaultOnly =
    body?.is_default === true &&
    body?.label === undefined &&
    body?.recipient_name === undefined;

  if (!setDefaultOnly) {
    const fieldErrors = {};
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const recipientName =
      typeof body?.recipient_name === "string"
        ? body.recipient_name.trim()
        : "";
    const recipientPhone =
      typeof body?.recipient_phone === "string"
        ? body.recipient_phone.trim()
        : "";
    const fullAddress =
      typeof body?.full_address === "string" ? body.full_address.trim() : "";
    const city = typeof body?.city === "string" ? body.city.trim() : "";
    const postalCode =
      typeof body?.postal_code === "string" ? body.postal_code.trim() : "";

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

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: "Periksa kembali data alamat pengiriman.", fieldErrors },
        { status: 400 }
      );
    }
  }

  try {
    const address = await withTransaction(async (client) => {
      const existingRes = await client.query(
        `SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [addressId, user.id]
      );
      const existing = existingRes.rows[0];
      if (!existing) {
        throw new AddressNotFoundError("Alamat tidak ditemukan.");
      }

      if (setDefaultOnly) {
        await client.query(
          `UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`,
          [user.id]
        );
        const updated = await client.query(
          `UPDATE user_addresses
           SET is_default = TRUE
           WHERE id = $1 AND user_id = $2
           RETURNING id, label, recipient_name, recipient_phone, full_address, city, postal_code, is_default, created_at`,
          [addressId, user.id]
        );
        return updated.rows[0];
      }

      const makeDefault =
        body?.is_default !== undefined
          ? Boolean(body.is_default)
          : existing.is_default;

      if (makeDefault) {
        await client.query(
          `UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`,
          [user.id]
        );
      }

      const updated = await client.query(
        `UPDATE user_addresses
         SET label = $1,
             recipient_name = $2,
             recipient_phone = $3,
             full_address = $4,
             city = $5,
             postal_code = $6,
             is_default = $7
         WHERE id = $8 AND user_id = $9
         RETURNING id, label, recipient_name, recipient_phone, full_address, city, postal_code, is_default, created_at`,
        [
          body.label.trim(),
          body.recipient_name.trim(),
          body.recipient_phone.trim(),
          body.full_address.trim(),
          body.city.trim(),
          typeof body.postal_code === "string" && body.postal_code.trim()
            ? body.postal_code.trim()
            : null,
          makeDefault,
          addressId,
          user.id,
        ]
      );

      return updated.rows[0];
    });

    return NextResponse.json(
      { message: "Alamat berhasil diperbarui.", address },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof AddressNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    console.error("PATCH /api/buyer/addresses/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui alamat pengiriman." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { user, error } = await requireApiRole(["buyer"]);
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const addressId = Number(rawId);
  if (!Number.isInteger(addressId) || addressId <= 0) {
    return NextResponse.json(
      { error: "ID alamat tidak valid." },
      { status: 400 }
    );
  }

  try {
    await withTransaction(async (client) => {
      const deletedRes = await client.query(
        `DELETE FROM user_addresses
         WHERE id = $1 AND user_id = $2
         RETURNING id, is_default`,
        [addressId, user.id]
      );

      if (deletedRes.rowCount === 0) {
        throw new AddressNotFoundError("Alamat tidak ditemukan.");
      }

      if (deletedRes.rows[0].is_default) {
        await client.query(
          `UPDATE user_addresses
           SET is_default = TRUE
           WHERE id = (
             SELECT id FROM user_addresses
             WHERE user_id = $1
             ORDER BY id DESC
             LIMIT 1
           )`,
          [user.id]
        );
      }
    });

    return NextResponse.json(
      { message: "Alamat berhasil dihapus." },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof AddressNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    console.error("DELETE /api/buyer/addresses/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus alamat pengiriman." },
      { status: 500 }
    );
  }
}
