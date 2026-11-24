import { NextResponse } from "next/server";
import { isForeignKeyRestrictError, query } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";
import { deleteUploadedImage } from "@/lib/upload";

function parseProductId(rawId) {
  const productId = Number(rawId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }
  return productId;
}

export async function PATCH(request, context) {
  const { error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const productId = parseProductId(rawId);
  if (!productId) {
    return NextResponse.json(
      { error: "ID produk tidak valid." },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format pembaruan status produk tidak valid." },
      { status: 400 }
    );
  }

  if (typeof body?.is_active !== "boolean") {
    return NextResponse.json(
      { error: "Status aktif produk harus berupa boolean (true/false)." },
      { status: 400 }
    );
  }

  const nextActive = body.is_active;
  const nextAdminDisabled = !nextActive;

  try {
    const updated = await query(
      `UPDATE products
       SET is_active = $1,
           admin_disabled = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, is_active, admin_disabled, updated_at`,
      [nextActive, nextAdminDisabled, productId]
    );

    if (updated.rowCount === 0) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    const row = updated.rows[0];
    return NextResponse.json(
      {
        message: nextActive
          ? `Produk "${row.name}" kembali diaktifkan oleh Admin.`
          : `Produk "${row.name}" dinonaktifkan oleh Admin sehingga penjual tidak dapat mengaktifkannya kembali.`,
        product: row,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH /api/admin/products/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui status moderasi produk." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const productId = parseProductId(rawId);
  if (!productId) {
    return NextResponse.json(
      { error: "ID produk tidak valid." },
      { status: 400 }
    );
  }

  try {
    const deleted = await query(
      `DELETE FROM products
       WHERE id = $1
       RETURNING id, name, image_url`,
      [productId]
    );

    if (deleted.rowCount === 0) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    await deleteUploadedImage(deleted.rows[0].image_url).catch(() => {});

    return NextResponse.json(
      { message: `Produk "${deleted.rows[0].name}" berhasil dihapus.` },
      { status: 200 }
    );
  } catch (err) {
    if (isForeignKeyRestrictError(err)) {
      return NextResponse.json(
        {
          error:
            "Produk ini sudah tercatat pada riwayat pesanan pembeli sehingga tidak dapat dihapus.",
        },
        { status: 409 }
      );
    }

    console.error("DELETE /api/admin/products/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus produk." },
      { status: 500 }
    );
  }
}
