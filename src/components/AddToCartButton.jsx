"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { CartIcon } from "@/components/ui/Icons";

export default function AddToCartButton({
  productId,
  productName,
  stockKg,
  isBuyer = false,
  isActive = true,
  quantityKg,
  fullWidth = true,
}) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const available = Number(stockKg);
  const isOutOfStock = !Number.isFinite(available) || available < 0.5;
  const resolvedQty =
    typeof quantityKg === "number"
      ? quantityKg
      : available >= 1
        ? 1
        : 0.5;

  if (!isActive) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F1F5F9] px-4 py-2.5 text-[15px] font-semibold text-[#64748B] ${
          fullWidth ? "w-full" : ""
        }`}
      >
        Produk Dinonaktifkan
      </button>
    );
  }

  if (isOutOfStock) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#E2E8F0] bg-[#F1F5F9] px-4 py-2.5 text-[15px] font-semibold text-[#64748B] ${
          fullWidth ? "w-full" : ""
        }`}
      >
        Stok Habis
      </button>
    );
  }

  if (!isBuyer) {
    const loginHref = `/login?callbackUrl=${encodeURIComponent(`/products/${productId}`)}`;
    return (
      <Link
        href={loginHref}
        className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[#0369A1] px-4 py-2.5 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] transition-colors ${
          fullWidth ? "w-full" : ""
        }`}
      >
        <CartIcon size={18} />
        <span>Tambah ke Keranjang</span>
      </Link>
    );
  }

  async function handleAddToCart() {
    setSubmitting(true);

    try {
      const response = await fetch("/api/buyer/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantityKg: resolvedQty,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showError(
          data?.error || `Gagal menambahkan ${productName} ke keranjang.`
        );
        setSubmitting(false);
        return;
      }

      showSuccess(data?.message || `${productName} ditambahkan ke keranjang`);
      setSubmitting(false);
      router.refresh();
    } catch {
      showError("Terjadi kendala jaringan. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={submitting}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[#0369A1] px-4 py-2.5 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50 transition-colors ${
        fullWidth ? "w-full" : ""
      }`}
    >
      <CartIcon size={18} />
      <span>{submitting ? "Menambahkan..." : "Tambah ke Keranjang"}</span>
    </button>
  );
}
