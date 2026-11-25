"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import { CloseIcon } from "@/components/ui/Icons";
import { formatDateTime } from "@/lib/format";

const QUICK_REJECTION_REASONS = [
  {
    label: "Data lapak kurang",
    value: "Data lapak atau lokasi dermaga belum lengkap dan perlu diperbaiki.",
  },
  {
    label: "Melanggar ketentuan",
    value:
      "Produk atau aktivitas lapak tidak sesuai dengan ketentuan platform.",
  },
  {
    label: "Perlu klarifikasi kontak",
    value: "Data pemilik atau kontak lapak memerlukan verifikasi lebih lanjut.",
  },
];

export default function AdminSellerQueueView({ initialSellers }) {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [sellers, setSellers] = useState(initialSellers);
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const dialogTitleId = useId();
  const dialogDescId = useId();
  const reasonInputId = useId();
  const reasonInputRef = useRef(null);

  const isRejectBusy = Boolean(rejectTarget && busyId === rejectTarget.id);

  useEffect(() => {
    if (!rejectTarget) {
      return undefined;
    }

    reasonInputRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isRejectBusy) {
        setRejectTarget(null);
        setRejectError("");
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [rejectTarget, isRejectBusy]);

  const filteredSellers =
    statusFilter === "all"
      ? sellers
      : sellers.filter((seller) => seller.seller_status === statusFilter);

  function openRejectModal(seller) {
    setRejectTarget(seller);
    setRejectReason(seller.rejection_reason || "");
    setRejectError("");
    setErrorMessage("");
  }

  function closeRejectModal() {
    if (isRejectBusy) {
      return;
    }
    setRejectTarget(null);
    setRejectReason("");
    setRejectError("");
  }

  async function updateSellerStatus(seller, nextStatus, reason = "") {
    const trimmedReason = reason.trim();
    if (
      nextStatus === "rejected" &&
      (trimmedReason.length < 10 || trimmedReason.length > 500)
    ) {
      setRejectError(
        "Alasan penolakan wajib diisi minimal 10 karakter (maksimal 500 karakter)."
      );
      reasonInputRef.current?.focus();
      return;
    }

    setBusyId(seller.id);
    setErrorMessage("");
    setRejectError("");

    try {
      const payload =
        nextStatus === "rejected"
          ? { status: "rejected", reason: trimmedReason }
          : { status: "approved" };

      const response = await fetch(`/api/admin/sellers/${seller.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          data?.error || "Gagal memperbarui status verifikasi seller.";
        if (nextStatus === "rejected") {
          setRejectError(msg);
        } else {
          setErrorMessage(msg);
        }
        setBusyId(null);
        return;
      }

      setSellers((prev) =>
        prev.map((item) =>
          item.id === seller.id
            ? {
                ...item,
                seller_status: nextStatus,
                rejection_reason:
                  nextStatus === "rejected"
                    ? (data?.seller?.rejection_reason ?? trimmedReason)
                    : null,
                rejected_at:
                  nextStatus === "rejected"
                    ? (data?.seller?.rejected_at ?? new Date().toISOString())
                    : null,
              }
            : item
        )
      );
      showSuccess(data?.message || `Status ${seller.full_name} diperbarui.`);
      setBusyId(null);
      setRejectTarget(null);
      setRejectReason("");
      setRejectError("");
      router.refresh();
    } catch {
      const msg = "Terjadi kendala jaringan saat memverifikasi seller.";
      if (nextStatus === "rejected") {
        setRejectError(msg);
      } else {
        setErrorMessage(msg);
      }
      setBusyId(null);
    }
  }

  function handleRejectSubmit(event) {
    event.preventDefault();
    if (!rejectTarget) {
      return;
    }
    updateSellerStatus(rejectTarget, "rejected", rejectReason);
  }

  if (sellers.length === 0) {
    return (
      <EmptyState
        title="Belum ada pendaftaran mitra seller"
        description="Pendaftaran akun Mitra Nelayan baru akan tampil di antrean ini untuk Anda setujui atau tolak."
      />
    );
  }

  const isRevokingApproved = rejectTarget?.seller_status === "approved";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-[14px] text-[#475569] tabular-nums">
          Menampilkan {filteredSellers.length} dari {sellers.length} mitra
          seller
        </p>

        <div className="flex items-center gap-3">
          <label
            htmlFor="admin-seller-filter"
            className="text-[14px] font-medium text-[#475569]"
          >
            Status:
          </label>
          <select
            id="admin-seller-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[44px] rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[15px] text-[#0F172A]"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu Verifikasi</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {filteredSellers.length === 0 ? (
        <EmptyState
          title="Tidak ada seller pada status ini"
          description="Pilih Semua Status untuk melihat seluruh daftar mitra nelayan."
          actionLabel="Tampilkan Semua Seller"
          onAction={() => setStatusFilter("all")}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[14px] font-medium text-[#475569]">
                <th className="py-3.5 px-5">Pemilik & Kontak</th>
                <th className="py-3.5 px-4">Lapak & Dermaga</th>
                <th className="py-3.5 px-4">Terdaftar</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[15px]">
              {filteredSellers.map((seller) => {
                const isBusy = busyId === seller.id;
                const activeProducts = seller.active_products_count ?? 0;
                const activeOrders = seller.active_orders_count ?? 0;

                return (
                  <tr key={seller.id}>
                    <td className="py-4 px-5">
                      <p className="font-semibold text-[#0F172A]">
                        {seller.full_name}
                      </p>
                      <p className="text-[14px] text-[#475569]">
                        {seller.email}
                      </p>
                      {seller.phone_number ? (
                        <p className="text-[14px] text-[#64748B]">
                          {seller.phone_number}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-[#0F172A]">
                        {seller.store_name}
                      </p>
                      <p className="text-[14px] text-[#475569]">
                        {seller.dock_location || "Lokasi dermaga belum diisi"}
                      </p>
                      {seller.seller_status === "approved" &&
                      (activeProducts > 0 || activeOrders > 0) ? (
                        <p className="mt-0.5 text-[13px] text-[#64748B] tabular-nums">
                          {activeProducts} produk aktif · {activeOrders} pesanan
                          berjalan
                        </p>
                      ) : null}
                    </td>
                    <td className="py-4 px-4 text-[14px] text-[#475569] whitespace-nowrap">
                      {formatDateTime(seller.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge
                        variant="seller"
                        status={seller.seller_status}
                      />
                      {seller.seller_status === "rejected" &&
                      seller.rejection_reason ? (
                        <p className="mt-1.5 max-w-[280px] text-[13px] leading-snug text-[#B91C1C]">
                          Alasan: {seller.rejection_reason}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2.5">
                        {seller.seller_status !== "approved" ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              updateSellerStatus(seller, "approved")
                            }
                            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-4 py-2 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
                          >
                            {isBusy ? "Memproses..." : "Approve"}
                          </button>
                        ) : null}
                        {seller.seller_status !== "rejected" ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => openRejectModal(seller)}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-4 py-2 text-[14px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-50"
                          >
                            Reject
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejectTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4"
          onClick={closeRejectModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescId}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[520px] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id={dialogTitleId}
                className="text-[20px] font-semibold text-[#0F172A]"
              >
                {isRevokingApproved ? "Nonaktifkan Mitra" : "Tolak Mitra"}
              </h2>
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={isRejectBusy}
                aria-label="Tutup dialog penolakan"
                className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] disabled:opacity-50"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <p id={dialogDescId} className="mt-2.5 text-[15px] text-[#334155]">
              {isRevokingApproved
                ? `Lapak "${rejectTarget.store_name || ""}" akan dinonaktifkan dan produknya disembunyikan dari pembeli.`
                : `Pendaftaran "${rejectTarget.store_name || ""}" akan ditolak dan alasan dikirim ke penjual.`}
            </p>

            {isRevokingApproved &&
            ((rejectTarget.active_products_count ?? 0) > 0 ||
              (rejectTarget.active_orders_count ?? 0) > 0) ? (
              <div
                role="status"
                className="mt-3.5 rounded-md border border-[#F59E0B] bg-[#FFFBEB] px-3.5 py-2.5 text-[14px] text-[#92400E]"
              >
                Lapak ini masih memiliki{" "}
                <strong>{rejectTarget.active_products_count ?? 0}</strong> produk
                aktif dan{" "}
                <strong>{rejectTarget.active_orders_count ?? 0}</strong> pesanan
                berjalan.
              </div>
            ) : null}

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              {rejectError ? <ErrorBanner message={rejectError} /> : null}

              <div className="space-y-2">
                <p className="text-[13px] font-medium text-[#475569]">
                  Template cepat (opsional):
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REJECTION_REASONS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      disabled={isRejectBusy}
                      onClick={() => {
                        setRejectReason(preset.value);
                        setRejectError("");
                      }}
                      className="inline-flex min-h-[36px] items-center rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1.5 text-[13px] font-medium text-[#334155] hover:border-[#0369A1] hover:text-[#0369A1] disabled:opacity-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label
                    htmlFor={reasonInputId}
                    className="text-[14px] font-medium text-[#0F172A]"
                  >
                    Alasan Penolakan <span className="text-[#B91C1C]">*</span>
                  </label>
                  <span className="text-[13px] text-[#64748B] tabular-nums">
                    {rejectReason.trim().length} / 500
                  </span>
                </div>
                <textarea
                  ref={reasonInputRef}
                  id={reasonInputId}
                  rows={3}
                  required
                  minLength={10}
                  maxLength={500}
                  disabled={isRejectBusy}
                  value={rejectReason}
                  onChange={(event) => {
                    setRejectReason(event.target.value);
                    if (rejectError) {
                      setRejectError("");
                    }
                  }}
                  placeholder="Tulis alasan penolakan (min. 10 karakter)..."
                  className="w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 py-2.5 text-[15px] text-[#0F172A] focus:border-[#0284C7] disabled:bg-[#F1F5F9]"
                />
              </div>

              <div className="pt-1 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={isRejectBusy}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRejectBusy}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#B91C1C] px-4 py-2 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#991B1B] disabled:opacity-50"
                >
                  {isRejectBusy
                    ? "Memproses..."
                    : isRevokingApproved
                      ? "Nonaktifkan Akun"
                      : "Tolak Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
