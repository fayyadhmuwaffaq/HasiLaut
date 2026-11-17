"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import {
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
  formatDateTime,
  formatKg,
  formatRupiah,
} from "@/lib/format";

export default function SellerOrdersView({ initialOrders }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  async function updateOrderStatus(order, nextStatus) {
    setBusyOrderId(order.id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/seller/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal memperbarui status pesanan.");
        setBusyOrderId(null);
        setCancelTarget(null);
        return;
      }

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, status: nextStatus } : item
        )
      );
      setStatusMessage(
        data?.message || `Status pesanan ${order.order_code} diperbarui.`
      );
      setBusyOrderId(null);
      setCancelTarget(null);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat memperbarui status.");
      setBusyOrderId(null);
      setCancelTarget(null);
    }
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Belum ada pesanan masuk"
        description="Pesanan baru dari pembeli akan tampil di sini beserta rincian berat Kg, metode pembayaran, dan alamat kirim."
        actionLabel="Lihat Produk Lapak"
        actionHref="/seller/dashboard/products"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-[14px] text-[#475569] tabular-nums">
          Menampilkan {filteredOrders.length} dari {orders.length} pesanan masuk
        </p>

        <div className="flex items-center gap-3">
          <label
            htmlFor="seller-order-filter"
            className="text-[14px] font-medium text-[#475569]"
          >
            Status:
          </label>
          <select
            id="seller-order-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[44px] rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[15px] text-[#0F172A]"
          >
            <option value="all">Semua Status</option>
            {Object.entries(ORDER_STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
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

      {filteredOrders.length === 0 ? (
        <EmptyState
          title="Tidak ada pesanan pada status ini"
          description="Pilih Semua Status untuk melihat seluruh riwayat pesanan lapak Anda."
          actionLabel="Tampilkan Semua Status"
          onAction={() => setStatusFilter("all")}
        />
      ) : (
        <div className="divide-y divide-[#E2E8F0] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
          {filteredOrders.map((order) => {
            const isBusy = busyOrderId === order.id;
            return (
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
                      Pembeli: {order.buyer_name}
                      {order.buyer_phone ? ` (${order.buyer_phone})` : ""} ·{" "}
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

                <div className="rounded-md bg-[#F8FAFC] p-4 text-[14px] text-[#334155]">
                  <p className="font-semibold text-[#0F172A] mb-1">
                    Alamat Pengiriman Pembeli
                  </p>
                  <p className="whitespace-pre-line">
                    {order.shipping_address_snapshot}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[14px] font-medium text-[#475569]">
                        <th className="py-2.5 pr-4">Produk</th>
                        <th className="py-2.5 px-4 text-right">Berat</th>
                        <th className="py-2.5 px-4 text-right">Harga / Kg</th>
                        <th className="py-2.5 pl-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-[15px]">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 pr-4 font-medium text-[#0F172A]">
                            {item.product_name_snapshot}
                          </td>
                          <td className="py-3 px-4 text-right text-[#334155] tabular-nums whitespace-nowrap">
                            {formatKg(item.quantity_kg)}
                          </td>
                          <td className="py-3 px-4 text-right text-[#334155] tabular-nums whitespace-nowrap">
                            {formatRupiah(item.price_per_kg_snapshot)}
                          </td>
                          <td className="py-3 pl-4 text-right font-semibold text-[#0F172A] tabular-nums whitespace-nowrap">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                  {order.status === "pending_payment" ? (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setCancelTarget(order)}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-4 py-2 text-[15px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-50"
                      >
                        Batalkan Pesanan
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateOrderStatus(order, "processing")}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
                      >
                        {isBusy ? "Memproses..." : "Proses Pesanan"}
                      </button>
                    </>
                  ) : null}

                  {order.status === "processing" ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => updateOrderStatus(order, "shipped")}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
                    >
                      {isBusy ? "Memproses..." : "Kirim Pesanan"}
                    </button>
                  ) : null}

                  {order.status === "shipped" ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => updateOrderStatus(order, "completed")}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
                    >
                      {isBusy ? "Memproses..." : "Tandai Selesai"}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Batalkan Pesanan Masuk"
        description={`Pesanan ${
          cancelTarget?.order_code || ""
        } akan dibatalkan dan seluruh stok produk akan dikembalikan otomatis ke lapak Anda.`}
        confirmLabel="Ya, Batalkan Pesanan"
        cancelLabel="Kembali"
        destructive
        loading={busyOrderId === cancelTarget?.id}
        onConfirm={() => updateOrderStatus(cancelTarget, "cancelled")}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
