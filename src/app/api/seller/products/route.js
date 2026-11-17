import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiApprovedSeller } from "@/lib/auth-guards";
import { getSellerProducts } from "@/lib/queries/seller";
import { parseNonNegativeDecimal } from "@/lib/format";
import {
  UploadValidationError,
  deleteUploadedImage,
  saveUploadedImage,
} from "@/lib/upload";

export async function GET() {
  const { store, error } = await requireApiApprovedSeller();
  if (error) {
    return error;
  }

  try {
    const products = await getSellerProducts(store.id);
    return NextResponse.json({ products }, { status: 200 });
  } catch (err) {
    console.error("GET /api/seller/products error:", err);
    return NextResponse.json(
      { error: "Gagal memuat daftar produk." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { store, error } = await requireApiApprovedSeller();
  if (error) {
    return error;
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format data produk harus menggunakan multipart/form-data." },
      { status: 400 }
    );
  }

  const name =
    typeof formData.get("name") === "string" ? formData.get("name").trim() : "";
  const description =
    typeof formData.get("description") === "string"
      ? formData.get("description").trim()
      : "";
  const categoryId = Number(formData.get("category_id"));
  const pricePerKg = parseNonNegativeDecimal(formData.get("price_per_kg"));
  const stockKg = parseNonNegativeDecimal(formData.get("stock_kg"));
  const imageEntry = formData.get("image");

  const fieldErrors = {};

  if (name.length < 2 || name.length > 150) {
    fieldErrors.name = "Nama produk wajib diisi (2 sampai 150 karakter).";
  }
  if (description.length < 5) {
    fieldErrors.description =
      "Deskripsi kondisi kesegaran dan ukuran wajib diisi (minimal 5 karakter).";
  }
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    fieldErrors.category_id = "Pilih kategori hasil laut.";
  }
  if (pricePerKg === null) {
    fieldErrors.price_per_kg = "Harga per kg harus berupa angka 0 atau lebih.";
  }
  if (stockKg === null) {
    fieldErrors.stock_kg = "Stok kg harus berupa angka 0 atau lebih.";
  }
  if (!imageEntry || typeof imageEntry !== "object" || imageEntry.size <= 0) {
    fieldErrors.image = "Foto produk wajib diunggah.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: "Periksa kembali data produk Anda.", fieldErrors },
      { status: 400 }
    );
  }

  const catCheck = await query(
    `SELECT id FROM categories WHERE id = $1 LIMIT 1`,
    [categoryId]
  );
  if (catCheck.rowCount === 0) {
    return NextResponse.json(
      {
        error: "Kategori yang dipilih tidak ditemukan.",
        fieldErrors: { category_id: "Kategori tidak valid." },
      },
      { status: 400 }
    );
  }

  let savedImageUrl;
  try {
    savedImageUrl = await saveUploadedImage(imageEntry, "products");
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json(
        { error: err.message, fieldErrors: { image: err.message } },
        { status: err.status }
      );
    }
    throw err;
  }

  try {
    const inserted = await query(
      `INSERT INTO products (
         store_id, category_id, name, description,
         price_per_kg, stock_kg, image_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, created_at`,
      [
        store.id,
        categoryId,
        name,
        description,
        pricePerKg,
        stockKg,
        savedImageUrl,
      ]
    );

    const row = inserted.rows[0];
    return NextResponse.json(
      {
        message: "Produk hasil laut berhasil ditambahkan.",
        product: {
          ...row,
          price_per_kg: Number(row.price_per_kg),
          stock_kg: Number(row.stock_kg),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    await deleteUploadedImage(savedImageUrl).catch(() => {});
    console.error("POST /api/seller/products error:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan produk baru." },
      { status: 500 }
    );
  }
}
