import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireApiApprovedSeller } from "@/lib/auth-guards";
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

  return NextResponse.json({ store }, { status: 200 });
}

export async function PATCH(request) {
  const { store, error } = await requireApiApprovedSeller();
  if (error) {
    return error;
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format data lapak harus menggunakan multipart/form-data." },
      { status: 400 }
    );
  }

  const storeName =
    typeof formData.get("store_name") === "string"
      ? formData.get("store_name").trim()
      : "";
  const dockLocation =
    typeof formData.get("dock_location") === "string"
      ? formData.get("dock_location").trim()
      : "";
  const description =
    typeof formData.get("description") === "string"
      ? formData.get("description").trim()
      : "";
  const imageEntry = formData.get("image");

  if (storeName.length < 2 || storeName.length > 100) {
    return NextResponse.json(
      { error: "Nama lapak atau toko wajib diisi (2 sampai 100 karakter)." },
      { status: 400 }
    );
  }

  if (dockLocation.length > 150) {
    return NextResponse.json(
      { error: "Lokasi dermaga maksimal 150 karakter." },
      { status: 400 }
    );
  }

  let newImageUrl = null;
  if (imageEntry && typeof imageEntry === "object" && imageEntry.size > 0) {
    try {
      newImageUrl = await saveUploadedImage(imageEntry, "stores");
    } catch (err) {
      if (err instanceof UploadValidationError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }
  }

  const finalImageUrl = newImageUrl ?? store.store_image_url;

  try {
    const result = await query(
      `UPDATE stores
       SET store_name = $1,
           dock_location = $2,
           description = $3,
           store_image_url = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, seller_id, store_name, description, dock_location, store_image_url, updated_at`,
      [
        storeName,
        dockLocation || null,
        description || null,
        finalImageUrl,
        store.id,
      ]
    );

    if (newImageUrl && store.store_image_url) {
      await deleteUploadedImage(store.store_image_url).catch(() => {});
    }

    return NextResponse.json(
      { message: "Profil lapak berhasil diperbarui.", store: result.rows[0] },
      { status: 200 }
    );
  } catch (err) {
    if (newImageUrl) {
      await deleteUploadedImage(newImageUrl).catch(() => {});
    }
    console.error("PATCH /api/seller/store error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui profil lapak." },
      { status: 500 }
    );
  }
}
