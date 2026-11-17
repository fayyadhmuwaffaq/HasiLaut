"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartIcon } from "@/components/ui/Icons";

export default function AddToCartButton({
  productId,
  productName,
  stockKg,
  isBuyer = false,
  quantityKg,
  fullWidth = true,
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const available = Number(stockKg);
  const isOutOfStock = !Number.isFinite(available) || available < 0.5;
  const resolvedQty =
    typeof quantityKg === "number"
      ? quantityKg
      : available >= 1
        ? 1
        : 0.5;

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
    setFeedback(null);

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
        setFeedback({
          type: "error",
          message:
            data?.error || `Gagal menambahkan ${productName} ke keranjang.`,
        });
        setSubmitting(false);
        return;
      }

      setFeedback({
        type: "success",
        message: data?.message || `${productName} ditambahkan ke keranjang.`,
      });
      setSubmitting(false);
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        message: "Terjadi kendala jaringan. Silakan coba lagi.",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className={fullWidth ? "w-full space-y-2" : "space-y-2"}>
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

      {feedback ? (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`rounded-md px-3 py-2 text-[14px] ${
            feedback.type === "error"
              ? "bg-[#FEF2F2] text-[#B91C1C]"
              : "bg-[#ECFDF5] text-[#047857]"
          }`}
        >
          <span>{feedback.message}</span>
          {feedback.type === "success" ? (
            <>
              {" "}
              <Link
                href="/buyer/cart"
                className="font-semibold underline hover:text-[#065F46]"
              >
                Lihat Keranjang
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
