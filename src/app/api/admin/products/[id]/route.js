import { NextResponse } from "next/server";
import { isForeignKeyRestrictError, query } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";
import { deleteUploadedImage } from "@/lib/upload";

export async function DELETE(_request, context) {
  const { error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const productId = Number(rawId);
  if (!Number.isInteger(productId) || productId <= 0) {
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
