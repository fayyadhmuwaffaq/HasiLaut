"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import { formatDateTime } from "@/lib/format";

export default function AdminSellerQueueView({ initialSellers }) {
  const router = useRouter();
  const [sellers, setSellers] = useState(initialSellers);
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const filteredSellers =
    statusFilter === "all"
      ? sellers
      : sellers.filter((seller) => seller.seller_status === statusFilter);

  async function updateSellerStatus(seller, nextStatus) {
    setBusyId(seller.id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/admin/sellers/${seller.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(
          data?.error || "Gagal memperbarui status verifikasi seller."
        );
        setBusyId(null);
        setRejectTarget(null);
        return;
      }

      setSellers((prev) =>
        prev.map((item) =>
          item.id === seller.id ? { ...item, seller_status: nextStatus } : item
        )
      );
      setStatusMessage(
        data?.message || `Status ${seller.full_name} diperbarui.`
      );
      setBusyId(null);
      setRejectTarget(null);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat memverifikasi seller.");
      setBusyId(null);
      setRejectTarget(null);
    }
  }

  if (sellers.length === 0) {
    return (
      <EmptyState
        title="Belum ada pendaftaran mitra seller"
        description="Pendaftaran akun Mitra Nelayan baru akan tampil di antrean ini untuk Anda setujui atau tolak."
      />
    );
  }

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

      {statusMessage ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-[#047857]/30 bg-[#ECFDF5] px-4 py-3 text-[15px] font-medium text-[#047857]"
        >
          {statusMessage}
        </p>
      ) : null}

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
                    </td>
                    <td className="py-4 px-4 text-[14px] text-[#475569] whitespace-nowrap">
                      {formatDateTime(seller.created_at)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge
                        variant="seller"
                        status={seller.seller_status}
                      />
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
                            onClick={() => setRejectTarget(seller)}
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

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Tolak Pendaftaran Mitra"
        description={`Akun mitra "${rejectTarget?.store_name || ""}" (${
          rejectTarget?.full_name || ""
        }) akan ditandai sebagai Ditolak dan tidak dapat menayangkan produk.`}
        confirmLabel="Ya, Tolak Seller"
        cancelLabel="Batal"
        destructive
        loading={busyId === rejectTarget?.id}
        onConfirm={() => updateSellerStatus(rejectTarget, "rejected")}
        onClose={() => setRejectTarget(null)}
      />
    </div>
  );
}
