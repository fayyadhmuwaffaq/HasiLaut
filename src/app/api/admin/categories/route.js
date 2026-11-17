import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiRole } from "@/lib/auth-guards";
import { getAdminCategories } from "@/lib/queries/admin";
import { slugify } from "@/lib/format";

export async function GET() {
  const { error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
  }

  try {
    const categories = await getAdminCategories();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/categories error:", err);
    return NextResponse.json(
      { error: "Gagal memuat daftar kategori." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { error } = await requireApiRole(["admin"]);
  if (error) {
    return error;
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
    const inserted = await query(
      `INSERT INTO categories (name, slug)
       VALUES ($1, $2)
       RETURNING id, name, slug, created_at`,
      [name, slug]
    );

    return NextResponse.json(
      {
        message: `Kategori "${name}" berhasil ditambahkan.`,
        category: { ...inserted.rows[0], product_count: 0 },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "Nama atau slug kategori tersebut sudah ada." },
        { status: 409 }
      );
    }

    console.error("POST /api/admin/categories error:", err);
    return NextResponse.json(
      { error: "Gagal menambahkan kategori." },
      { status: 500 }
    );
  }
}
