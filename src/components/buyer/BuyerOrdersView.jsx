"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import { CloseIcon, StarIcon } from "@/components/ui/Icons";
import {
  PAYMENT_METHOD_LABELS,
  formatDateTime,
  formatKg,
  formatRupiah,
} from "@/lib/format";

export default function BuyerOrdersView({
  initialOrders,
  checkoutSuccessCount = 0,
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [reviewItem, setReviewItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const reviewTitleId = useId();
  const closeReviewRef = useRef(null);

  useEffect(() => {
    if (!reviewItem) {
      return undefined;
    }

    closeReviewRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !submittingReview) {
        setReviewItem(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [reviewItem, submittingReview]);

  async function handleConfirmCancel() {
    if (!cancelTarget) {
      return;
    }

    setCancelling(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(
        `/api/buyer/orders/${cancelTarget.id}/cancel`,
        {
          method: "POST",
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal membatalkan pesanan.");
        setCancelling(false);
        setCancelTarget(null);
        return;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === cancelTarget.id
            ? { ...order, status: "cancelled" }
            : order
        )
      );
      setStatusMessage(data?.message || "Pesanan berhasil dibatalkan.");
      setCancelling(false);
      setCancelTarget(null);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat membatalkan pesanan.");
      setCancelling(false);
      setCancelTarget(null);
    }
  }

  function openReviewModal(item) {
    setReviewItem(item);
    setRating(5);
    setComment("");
    setReviewError("");
  }

  async function handleSubmitReview(event) {
    event.preventDefault();
    if (!reviewItem) {
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    try {
      const response = await fetch("/api/buyer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItemId: reviewItem.id,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setReviewError(data?.error || "Gagal menyimpan ulasan.");
        setSubmittingReview(false);
        return;
      }

      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: order.items.map((it) =>
            it.id === reviewItem.id
              ? {
                  ...it,
                  review_id: data.review.id,
                  review_rating: data.review.rating,
                  review_comment: data.review.comment,
                }
              : it
          ),
        }))
      );
      setStatusMessage("Ulasan Anda telah dipublikasikan.");
      setSubmittingReview(false);
      setReviewItem(null);
      router.refresh();
    } catch {
      setReviewError("Terjadi kendala jaringan saat mengirim ulasan.");
      setSubmittingReview(false);
    }
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Belum ada riwayat pesanan"
        description="Setelah Anda melakukan checkout dari keranjang, rincian dan status pesanan akan muncul di halaman ini."
        actionLabel="Lihat Katalog Produk"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="space-y-6">
      {checkoutSuccessCount > 0 ? (
        <div
          role="status"
          className="rounded-md border border-[#047857]/30 bg-[#ECFDF5] px-4 py-3 text-[15px] font-medium text-[#047857]"
        >
          {checkoutSuccessCount} pesanan berhasil dibuat. Pantau perkembangan
          status pengiriman Anda di bawah ini.
        </div>
      ) : null}

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

      <div className="divide-y divide-[#E2E8F0] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
        {orders.map((order) => (
          <article key={order.id} className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[18px] font-semibold text-[#0F172A] tabular-nums">
                    {order.order_code}
                  </h2>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-[14px] text-[#475569]">
                  {order.store_name}
                  {order.dock_location ? ` · ${order.dock_location}` : ""} ·{" "}
                  {formatDateTime(order.created_at)}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-[14px] text-[#475569]">
                  {PAYMENT_METHOD_LABELS[order.payment_method] ||
                    order.payment_method}
                </p>
                <p className="text-[20px] font-bold text-[#0284C7] tabular-nums">
                  {formatRupiah(order.total_amount)}
                </p>
              </div>
            </div>

            {order.payment_method === "bank_transfer" &&
            order.status === "pending_payment" ? (
              <div className="rounded-md border border-[#B45309]/30 bg-[#FFFBEB] p-4 text-[14px] text-[#B45309] space-y-1">
                <p className="font-semibold">
                  Instruksi Transfer Bank Manual
                </p>
                <p>
                  Selesaikan transfer sebesar{" "}
                  <span className="font-bold tabular-nums">
                    {formatRupiah(order.total_amount)}
                  </span>{" "}
                  dan sertakan kode referensi{" "}
                  <span className="font-bold tabular-nums">
                    {order.order_code}
                  </span>{" "}
                  pada berita transfer agar lapak dapat segera memproses pesanan.
                </p>
              </div>
            ) : null}

            <div className="rounded-md bg-[#F8FAFC] p-4 text-[14px] text-[#334155]">
              <p className="font-semibold text-[#0F172A] mb-1">
                Alamat Pengiriman
              </p>
              <p className="whitespace-pre-line">
                {order.shipping_address_snapshot}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[14px] font-medium text-[#475569]">
                    <th className="py-3 pr-4">Produk</th>
                    <th className="py-3 px-4 text-right">Berat</th>
                    <th className="py-3 px-4 text-right">Harga / Kg</th>
                    <th className="py-3 pl-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[15px]">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 pr-4">
                        <Link
                          href={`/products/${item.product_id}`}
                          className="font-semibold text-[#0F172A] hover:text-[#0369A1]"
                        >
                          {item.product_name_snapshot}
                        </Link>

                        {order.status === "completed" ? (
                          <div className="mt-2">
                            {item.review_id ? (
                              <div className="text-[14px] text-[#334155] space-y-0.5">
                                <p className="inline-flex items-center gap-1 font-semibold text-[#047857] tabular-nums">
                                  <StarIcon size={15} filled />
                                  <span>
                                    Ulasan terkirim: Rating {item.review_rating}{" "}
                                    / 5
                                  </span>
                                </p>
                                {item.review_comment ? (
                                  <p className="text-[#475569]">
                                    {item.review_comment}
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openReviewModal(item)}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-4 py-2 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#075985]"
                              >
                                Beri Rating & Ulasan
                              </button>
                            )}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-4 px-4 text-right text-[#334155] tabular-nums whitespace-nowrap">
                        {formatKg(item.quantity_kg)}
                      </td>
                      <td className="py-4 px-4 text-right text-[#334155] tabular-nums whitespace-nowrap">
                        {formatRupiah(item.price_per_kg_snapshot)}
                      </td>
                      <td className="py-4 pl-4 text-right font-semibold text-[#0F172A] tabular-nums whitespace-nowrap">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {order.status === "pending_payment" ? (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCancelTarget(order)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-4 py-2 text-[15px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2]"
                >
                  Batalkan Pesanan
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Batalkan Pesanan"
        description={`Pesanan ${
          cancelTarget?.order_code || ""
        } akan dibatalkan dan stok produk akan dikembalikan ke lapak.`}
        confirmLabel="Ya, Batalkan Pesanan"
        cancelLabel="Kembali"
        destructive
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelTarget(null)}
      />

      {reviewItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4"
          onClick={() => {
            if (!submittingReview) {
              setReviewItem(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={reviewTitleId}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[480px] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id={reviewTitleId}
                  className="text-[20px] font-semibold text-[#0F172A]"
                >
                  Beri Rating & Ulasan
                </h2>
                <p className="mt-1 text-[14px] text-[#475569]">
                  {reviewItem.product_name_snapshot}
                </p>
              </div>
              <button
                ref={closeReviewRef}
                type="button"
                onClick={() => setReviewItem(null)}
                disabled={submittingReview}
                aria-label="Tutup dialog ulasan"
                className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-md border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {reviewError ? (
              <p
                role="alert"
                className="mt-4 rounded-md border border-[#B91C1C] bg-[#FEF2F2] px-3.5 py-2.5 text-[14px] font-medium text-[#B91C1C]"
              >
                {reviewError}
              </p>
            ) : null}

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-5">
              <fieldset>
                <legend className="mb-2 text-[14px] font-medium text-[#475569]">
                  Nilai Kesegaran & Pelayanan (1 sampai 5)
                </legend>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = rating === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-pressed={active}
                        className={`inline-flex h-[44px] min-w-[52px] items-center justify-center gap-1 rounded-md border px-3 text-[15px] font-semibold tabular-nums ${
                          active
                            ? "border-[#0369A1] bg-[#0369A1] text-[#FFFFFF]"
                            : "border-[#64748B] bg-[#FFFFFF] text-[#0F172A] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <StarIcon size={15} filled={active} />
                        <span>{value}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="review-comment"
                  className="block mb-2 text-[14px] font-medium text-[#475569]"
                >
                  Ulasan Anda (Opsional)
                </label>
                <textarea
                  id="review-comment"
                  rows={3}
                  maxLength={1000}
                  placeholder="Ceritakan kesegaran hasil laut dan ketepatan berat pesanan..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-md border border-[#64748B] bg-[#FFFFFF] p-3 text-[16px] text-[#0F172A] placeholder:text-[#64748B]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  disabled={submittingReview}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
                >
                  {submittingReview ? "Mengirim..." : "Kirim Ulasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
