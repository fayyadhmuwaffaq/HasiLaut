import { NextResponse } from "next/server";
import { isForeignKeyRestrictError, query } from "@/lib/db";
import { requireApiApprovedSeller } from "@/lib/auth-guards";
import { getSellerProductById } from "@/lib/queries/seller";
import { parseNonNegativeDecimal } from "@/lib/format";
import {
  UploadValidationError,
  deleteUploadedImage,
  saveUploadedImage,
} from "@/lib/upload";

export async function GET(_request, context) {
  const { store, error } = await requireApiApprovedSeller();
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const product = await getSellerProductById(rawId, store.id);
  if (!product) {
    return NextResponse.json(
      { error: "Produk tidak ditemukan di lapak Anda." },
      { status: 404 }
    );
  }

  return NextResponse.json({ product }, { status: 200 });
}

export async function PATCH(request, context) {
  const { store, error } = await requireApiApprovedSeller();
  if (error) {
    return error;
  }

  const { id: rawId } = await context.params;
  const existing = await getSellerProductById(rawId, store.id);
  if (!existing) {
    return NextResponse.json(
      { error: "Produk tidak ditemukan di lapak Anda." },
      { status: 404 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format pembaruan produk harus menggunakan multipart/form-data." },
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

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: "Periksa kembali perubahan data produk.", fieldErrors },
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

  let newImageUrl = null;
  if (imageEntry && typeof imageEntry === "object" && imageEntry.size > 0) {
    try {
      newImageUrl = await saveUploadedImage(imageEntry, "products");
    } catch (err) {
      if (err instanceof UploadValidationError) {
        return NextResponse.json(
          { error: err.message, fieldErrors: { image: err.message } },
          { status: err.status }
        );
      }
      throw err;
    }
  }

  const finalImageUrl = newImageUrl ?? existing.image_url;

  try {
    const updated = await query(
      `UPDATE products
       SET category_id = $1,
           name = $2,
           description = $3,
           price_per_kg = $4,
           stock_kg = $5,
           image_url = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND store_id = $8
       RETURNING id, store_id, category_id, name, description, price_per_kg, stock_kg, image_url, updated_at`,
      [
        categoryId,
        name,
        description,
        pricePerKg,
        stockKg,
        finalImageUrl,
        existing.id,
        store.id,
      ]
    );

    if (newImageUrl && existing.image_url) {
      await deleteUploadedImage(existing.image_url).catch(() => {});
    }

    const row = updated.rows[0];
    return NextResponse.json(
      {
        message: "Produk berhasil diperbarui.",
        product: {
          ...row,
          price_per_kg: Number(row.price_per_kg),
          stock_kg: Number(row.stock_kg),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    if (newImageUrl) {
      await deleteUploadedImage(newImageUrl).catch(() => {});
    }
    console.error("PATCH /api/seller/products/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui produk." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { store, error } = await requireApiApprovedSeller();
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
       WHERE id = $1 AND store_id = $2
       RETURNING id, image_url`,
      [productId, store.id]
    );

    if (deleted.rowCount === 0) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan di lapak Anda." },
        { status: 404 }
      );
    }

    await deleteUploadedImage(deleted.rows[0].image_url).catch(() => {});

    return NextResponse.json(
      { message: "Produk berhasil dihapus." },
      { status: 200 }
    );
  } catch (err) {
    if (isForeignKeyRestrictError(err)) {
      return NextResponse.json(
        {
          error:
            "Produk ini sudah memiliki riwayat pesanan sehingga tidak dapat dihapus. Ubah stok menjadi 0 kg untuk menonaktifkan penjualan.",
        },
        { status: 409 }
      );
    }

    console.error("DELETE /api/seller/products/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus produk." },
      { status: 500 }
    );
  }
}
