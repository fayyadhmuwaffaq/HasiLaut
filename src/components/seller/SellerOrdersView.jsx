"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import OrderStatusTabs from "@/components/ui/OrderStatusTabs";
import CollapsibleOrderCard from "@/components/ui/CollapsibleOrderCard";
import { useToast } from "@/components/ui/ToastProvider";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import { formatDateTime, formatKg, formatRupiah } from "@/lib/format";

const SELLER_ORDER_TABS = [
  { id: "all", label: "Semua" },
  { id: "pending_payment", label: "Belum Bayar" },
  { id: "processing", label: "Diproses" },
  { id: "shipped", label: "Dikirim" },
  { id: "completed", label: "Selesai" },
  { id: "cancelled", label: "Dibatalkan" },
];

export default function SellerOrdersView({
  initialOrders,
  initialTab = "all",
}) {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const resolvedInitialTab = SELLER_ORDER_TABS.some((t) => t.id === initialTab)
    ? initialTab
    : "all";
  const [activeTab, setActiveTab] = useState(resolvedInitialTab);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const tabCounts = useMemo(() => {
    const counts = Object.fromEntries(
      SELLER_ORDER_TABS.map((tab) => [tab.id, 0])
    );
    counts.all = orders.length;
    for (const order of orders) {
      if (Object.hasOwn(counts, order.status)) {
        counts[order.status] += 1;
      }
    }
    return counts;
  }, [orders]);

  const visibleOrders = useMemo(
    () =>
      activeTab === "all"
        ? orders
        : orders.filter((order) => order.status === activeTab),
    [orders, activeTab]
  );

  async function updateOrderStatus(order, nextStatus) {
    setBusyOrderId(order.id);
    setErrorMessage("");

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
      showSuccess(
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

  function renderOrderActions(order) {
    const isBusy = busyOrderId === order.id;

    if (order.status === "pending_payment") {
      return (
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
      );
    }

    if (order.status === "processing") {
      return (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => updateOrderStatus(order, "shipped")}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
        >
          {isBusy ? "Memproses..." : "Kirim Pesanan"}
        </button>
      );
    }

    return null;
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
    <div className="space-y-6">
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <OrderStatusTabs
        tabs={SELLER_ORDER_TABS}
        activeTab={activeTab}
        counts={tabCounts}
        ariaLabel="Klasifikasi status pesanan masuk"
        idPrefix="seller-orders"
        onChange={setActiveTab}
      />

      <div
        id={`seller-orders-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`seller-orders-tab-${activeTab}`}
        className="space-y-6"
      >
        {visibleOrders.length === 0 ? (
          <EmptyState
            title={`Tidak ada pesanan di kategori "${
              SELLER_ORDER_TABS.find((t) => t.id === activeTab)?.label || "ini"
            }"`}
            description="Pilih tab Semua untuk melihat seluruh riwayat pesanan lapak Anda."
            actionLabel="Lihat Semua Pesanan"
            onAction={() => setActiveTab("all")}
          />
        ) : (
          <div className="space-y-6">
            {visibleOrders.map((order) => (
              <CollapsibleOrderCard
                key={order.id}
                order={order}
                addressTitle="Alamat Pengiriman Pembeli"
                summaryNote={
                  order.status === "shipped" ? (
                    <p className="text-[13px] font-medium text-[#0369A1]">
                      Pesanan telah dikirim. Menunggu konfirmasi penerimaan oleh
                      pembeli.
                    </p>
                  ) : null
                }
                subtitle={
                  <p className="text-[14px] text-[#475569]">
                    Pembeli: {order.buyer_name}
                    {order.buyer_phone ? ` (${order.buyer_phone})` : ""} ·{" "}
                    {formatDateTime(order.created_at)}
                  </p>
                }
                actions={renderOrderActions(order)}
              >
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
              </CollapsibleOrderCard>
            ))}
          </div>
        )}
      </div>

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
