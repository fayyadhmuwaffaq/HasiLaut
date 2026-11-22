import "server-only";
import { query } from "@/lib/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DUPLICATE_EMAIL_MESSAGE =
  "Email tersebut sudah digunakan oleh akun lain.";

/**
 * Validate and update a signed-in user's own name, email, and optional phone number.
 */
export async function updateOwnAccountIdentity({
  userId,
  role,
  body,
  includePhone = false,
}) {
  const fullName =
    typeof body?.full_name === "string" ? body.full_name.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phoneNumber =
    typeof body?.phone_number === "string" ? body.phone_number.trim() : "";

  const fieldErrors = {};
  if (fullName.length < 2 || fullName.length > 100) {
    fieldErrors.full_name =
      "Nama lengkap wajib diisi (2 sampai 100 karakter).";
  }
  if (!email || email.length > 120 || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email =
      "Masukkan alamat email yang valid (maksimal 120 karakter).";
  }
  if (includePhone && phoneNumber.length > 20) {
    fieldErrors.phone_number = "Nomor telepon maksimal 20 karakter.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      status: 400,
      error: Object.values(fieldErrors)[0],
      fieldErrors,
    };
  }

  const conflict = await query(
    `SELECT id
     FROM users
     WHERE LOWER(email) = $1 AND id <> $2
     LIMIT 1`,
    [email, userId]
  );

  if (conflict.rowCount > 0) {
    return {
      ok: false,
      status: 409,
      error: DUPLICATE_EMAIL_MESSAGE,
      fieldErrors: { email: DUPLICATE_EMAIL_MESSAGE },
    };
  }

  try {
    const updated = includePhone
      ? await query(
          `UPDATE users
           SET full_name = $1,
               email = $2,
               phone_number = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4 AND role = $5
           RETURNING id, full_name, email, phone_number, role`,
          [fullName, email, phoneNumber || null, userId, role]
        )
      : await query(
          `UPDATE users
           SET full_name = $1,
               email = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3 AND role = $4
           RETURNING id, full_name, email, role`,
          [fullName, email, userId, role]
        );

    if (updated.rowCount === 0) {
      return {
        ok: false,
        status: 404,
        error: "Akun pengguna tidak ditemukan.",
        fieldErrors: null,
      };
    }

    return {
      ok: true,
      status: 200,
      user: updated.rows[0],
    };
  } catch (err) {
    if (err?.code === "23505") {
      return {
        ok: false,
        status: 409,
        error: DUPLICATE_EMAIL_MESSAGE,
        fieldErrors: { email: DUPLICATE_EMAIL_MESSAGE },
      };
    }
    throw err;
  }
}
