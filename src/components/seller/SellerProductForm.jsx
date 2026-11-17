"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorBanner } from "@/components/ui/FeedbackStates";

export default function SellerProductForm({
  categories,
  initialProduct = null,
}) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct);
  const objectUrlRef = useRef(null);

  const [name, setName] = useState(initialProduct?.name || "");
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id
      ? String(initialProduct.category_id)
      : categories[0]
        ? String(categories[0].id)
        : ""
  );
  const [pricePerKg, setPricePerKg] = useState(
    initialProduct !== null ? String(initialProduct.price_per_kg) : ""
  );
  const [stockKg, setStockKg] = useState(
    initialProduct !== null ? String(initialProduct.stock_kg) : ""
  );
  const [description, setDescription] = useState(
    initialProduct?.description || ""
  );
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    initialProduct?.image_url || "/placeholders/seafood-placeholder.svg"
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setImageFile(file);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (file) {
      const nextUrl = URL.createObjectURL(file);
      objectUrlRef.current = nextUrl;
      setPreviewUrl(nextUrl);
    } else {
      setPreviewUrl(
        initialProduct?.image_url || "/placeholders/seafood-placeholder.svg"
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const errors = {};
    if (name.trim().length < 2 || name.trim().length > 150) {
      errors.name = "Nama produk wajib diisi (2 sampai 150 karakter).";
    }
    if (!categoryId) {
      errors.category_id = "Pilih kategori hasil laut.";
    }
    const numericPrice = Number(pricePerKg);
    if (pricePerKg.trim() === "" || !Number.isFinite(numericPrice) || numericPrice < 0) {
      errors.price_per_kg = "Harga per kg harus berupa angka 0 atau lebih.";
    }
    const numericStock = Number(stockKg);
    if (stockKg.trim() === "" || !Number.isFinite(numericStock) || numericStock < 0) {
      errors.stock_kg = "Stok kg harus berupa angka 0 atau lebih.";
    }
    if (description.trim().length < 5) {
      errors.description =
        "Deskripsi kondisi kesegaran dan ukuran minimal 5 karakter.";
    }
    if (!isEdit && !imageFile) {
      errors.image = "Foto produk wajib diunggah.";
    }
    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      errors.image = "Ukuran gambar maksimal 2 MB.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("category_id", categoryId);
    formData.set("price_per_kg", String(numericPrice));
    formData.set("stock_kg", String(numericStock));
    formData.set("description", description.trim());
    if (imageFile) {
      formData.set("image", imageFile);
    }

    const endpoint = isEdit
      ? `/api/seller/products/${initialProduct.id}`
      : "/api/seller/products";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setFormError(data?.error || "Gagal menyimpan data produk.");
        setSubmitting(false);
        return;
      }

      router.push("/seller/dashboard/products");
      router.refresh();
    } catch {
      setFormError("Terjadi kendala jaringan saat menyimpan produk.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-[760px] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-6"
    >
      {formError ? <ErrorBanner message={formError} /> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label
            htmlFor="product-name"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Nama Produk Hasil Laut
          </label>
          <input
            id="product-name"
            name="name"
            type="text"
            required
            maxLength={150}
            placeholder="Contoh: Ikan Kakap Merah Segar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
          />
          {fieldErrors.name ? (
            <p className="mt-1.5 text-[14px] text-[#B91C1C]">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="product-category"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Kategori
          </label>
          <select
            id="product-category"
            name="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-invalid={Boolean(fieldErrors.category_id)}
            className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[16px] text-[#0F172A] focus:border-[#0284C7]"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {fieldErrors.category_id ? (
            <p className="mt-1.5 text-[14px] text-[#B91C1C]">
              {fieldErrors.category_id}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="product-price"
              className="block mb-2 text-[14px] font-medium text-[#475569]"
            >
              Harga / Kg (Rp)
            </label>
            <input
              id="product-price"
              name="price_per_kg"
              type="number"
              min="0"
              step="500"
              inputMode="numeric"
              placeholder="45000"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
              aria-invalid={Boolean(fieldErrors.price_per_kg)}
              className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[16px] text-[#0F172A] tabular-nums focus:border-[#0284C7]"
            />
            {fieldErrors.price_per_kg ? (
              <p className="mt-1.5 text-[14px] text-[#B91C1C]">
                {fieldErrors.price_per_kg}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="product-stock"
              className="block mb-2 text-[14px] font-medium text-[#475569]"
            >
              Stok (Kg)
            </label>
            <input
              id="product-stock"
              name="stock_kg"
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              placeholder="10"
              value={stockKg}
              onChange={(e) => setStockKg(e.target.value)}
              aria-invalid={Boolean(fieldErrors.stock_kg)}
              className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[16px] text-[#0F172A] tabular-nums focus:border-[#0284C7]"
            />
            {fieldErrors.stock_kg ? (
              <p className="mt-1.5 text-[14px] text-[#B91C1C]">
                {fieldErrors.stock_kg}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="product-description"
          className="block mb-2 text-[14px] font-medium text-[#475569]"
        >
          Deskripsi Kondisi Kesegaran & Ukuran
        </label>
        <textarea
          id="product-description"
          name="description"
          rows={4}
          placeholder="Jelaskan ukuran per ekor/kg, waktu tangkap, serta kondisi penyimpanan..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={Boolean(fieldErrors.description)}
          className="w-full rounded-md border border-[#64748B] bg-[#FFFFFF] p-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
        />
        {fieldErrors.description ? (
          <p className="mt-1.5 text-[14px] text-[#B91C1C]">
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start border-t border-[#E2E8F0] pt-5">
        <div className="sm:col-span-5">
          <p className="mb-2 text-[14px] font-medium text-[#475569]">
            Pratinjau Foto (4:3)
          </p>
          <div className="aspect-[4/3] w-full rounded-md border border-[#E2E8F0] bg-[#F1F5F9] overflow-hidden">
            <Image
              src={previewUrl}
              alt="Pratinjau foto produk"
              width={400}
              height={300}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="sm:col-span-7 space-y-2">
          <label
            htmlFor="product-image"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            {isEdit ? "Ganti Foto Produk (Opsional)" : "Unggah Foto Produk"}
          </label>
          <input
            id="product-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            aria-invalid={Boolean(fieldErrors.image)}
            aria-describedby="product-image-help"
            className="block w-full min-h-[44px] rounded-md border border-[#64748B] bg-[#FFFFFF] p-2 text-[15px] text-[#0F172A]"
          />
          <p id="product-image-help" className="text-[14px] text-[#64748B]">
            Gunakan foto JPEG, PNG, atau WebP dengan ukuran maksimal 2 MB.
          </p>
          {fieldErrors.image ? (
            <p className="text-[14px] text-[#B91C1C]">{fieldErrors.image}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[#E2E8F0] pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
        >
          {submitting
            ? "Menyimpan..."
            : isEdit
              ? "Simpan Perubahan"
              : "Simpan Produk"}
        </button>

        <Link
          href="/seller/dashboard/products"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2.5 text-[16px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
