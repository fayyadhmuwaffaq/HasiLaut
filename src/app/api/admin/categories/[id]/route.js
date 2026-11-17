import { NextResponse } from "next/server";
import { isForeignKeyRestrictError, query } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";
import { slugify } from "@/lib/format";

export async function PATCH(request, context) {
  const { error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const categoryId = Number(rawId);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return NextResponse.json(
      { error: "ID kategori tidak valid." },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format data kategori tidak valid." },
      { status: 400 }
    );
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json(
      { error: "Nama kategori wajib diisi (2 sampai 100 karakter)." },
      { status: 400 }
    );
  }

  const slug = slugify(name);
  if (!slug || slug.length > 100) {
    return NextResponse.json(
      { error: "Nama kategori harus memuat huruf atau angka yang valid." },
      { status: 400 }
    );
  }

  try {
    const updated = await query(
      `UPDATE categories
       SET name = $1,
           slug = $2
       WHERE id = $3
       RETURNING id, name, slug, created_at`,
      [name, slug, categoryId]
    );

    if (updated.rowCount === 0) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Kategori berhasil diperbarui.",
        category: updated.rows[0],
      },
      { status: 200 }
    );
  } catch (err) {
    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "Nama atau slug kategori tersebut sudah digunakan." },
        { status: 409 }
      );
    }

    console.error("PATCH /api/admin/categories/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui kategori." },
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
  const categoryId = Number(rawId);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return NextResponse.json(
      { error: "ID kategori tidak valid." },
      { status: 400 }
    );
  }

  try {
    const deleted = await query(
      `DELETE FROM categories WHERE id = $1 RETURNING id, name`,
      [categoryId]
    );

    if (deleted.rowCount === 0) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `Kategori "${deleted.rows[0].name}" berhasil dihapus.` },
      { status: 200 }
    );
  } catch (err) {
    if (isForeignKeyRestrictError(err)) {
      return NextResponse.json(
        {
          error:
            "Kategori ini masih digunakan oleh produk terdaftar sehingga tidak dapat dihapus.",
        },
        { status: 409 }
      );
    }

    console.error("DELETE /api/admin/categories/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus kategori." },
      { status: 500 }
    );
  }
}
