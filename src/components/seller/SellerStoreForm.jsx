"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ErrorBanner } from "@/components/ui/FeedbackStates";

export default function SellerStoreForm({ initialStore }) {
  const router = useRouter();
  const objectUrlRef = useRef(null);

  const [storeName, setStoreName] = useState(initialStore.store_name || "");
  const [dockLocation, setDockLocation] = useState(
    initialStore.dock_location || ""
  );
  const [description, setDescription] = useState(
    initialStore.description || ""
  );
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    initialStore.store_image_url || "/placeholders/store-placeholder.svg"
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

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
        initialStore.store_image_url || "/placeholders/store-placeholder.svg"
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (storeName.trim().length < 2 || storeName.trim().length > 100) {
      setErrorMessage("Nama lapak wajib diisi (2 sampai 100 karakter).");
      return;
    }

    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      setErrorMessage("Ukuran foto lapak maksimal 2 MB.");
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.set("store_name", storeName.trim());
    formData.set("dock_location", dockLocation.trim());
    formData.set("description", description.trim());
    if (imageFile) {
      formData.set("image", imageFile);
    }

    try {
      const response = await fetch("/api/seller/store", {
        method: "PATCH",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal menyimpan profil lapak.");
        setSaving(false);
        return;
      }

      if (data?.store?.store_image_url) {
        setPreviewUrl(data.store.store_image_url);
      }
      setImageFile(null);
      setStatusMessage(data?.message || "Profil lapak berhasil diperbarui.");
      setSaving(false);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat menyimpan profil lapak.");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-[760px] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-6"
    >
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {statusMessage ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-[#047857]/30 bg-[#ECFDF5] px-4 py-3 text-[15px] font-medium text-[#047857]"
        >
          {statusMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="store-name"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Nama Lapak / Toko
          </label>
          <input
            id="store-name"
            name="store_name"
            type="text"
            required
            maxLength={100}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] focus:border-[#0284C7]"
          />
        </div>

        <div>
          <label
            htmlFor="store-dock"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Lokasi Dermaga / TPI
          </label>
          <input
            id="store-dock"
            name="dock_location"
            type="text"
            maxLength={150}
            placeholder="Contoh: TPI Paotere, Makassar"
            value={dockLocation}
            onChange={(e) => setDockLocation(e.target.value)}
            className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="store-description"
          className="block mb-2 text-[14px] font-medium text-[#475569]"
        >
          Deskripsi Lapak
        </label>
        <textarea
          id="store-description"
          name="description"
          rows={4}
          placeholder="Informasi singkat tentang jam lelang, jenis tangkapan unggulan, atau pengiriman..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-[#64748B] bg-[#FFFFFF] p-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start border-t border-[#E2E8F0] pt-5">
        <div className="sm:col-span-5">
          <p className="mb-2 text-[14px] font-medium text-[#475569]">
            Foto / Logo Lapak (4:3)
          </p>
          <div className="aspect-[4/3] w-full rounded-md border border-[#E2E8F0] bg-[#F1F5F9] overflow-hidden">
            <Image
              src={previewUrl}
              alt={`Foto lapak ${storeName || "mitra"}`}
              width={400}
              height={300}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="sm:col-span-7 space-y-2">
          <label
            htmlFor="store-image"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Unggah Foto Lapak (Opsional)
          </label>
          <input
            id="store-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            aria-describedby="store-image-help"
            className="block w-full min-h-[44px] rounded-md border border-[#64748B] bg-[#FFFFFF] p-2 text-[15px] text-[#0F172A]"
          />
          <p id="store-image-help" className="text-[14px] text-[#64748B]">
            Format JPEG, PNG, atau WebP maksimal 2 MB.
          </p>
        </div>
      </div>

      <div className="border-t border-[#E2E8F0] pt-5">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Profil Lapak"}
        </button>
      </div>
    </form>
  );
}
