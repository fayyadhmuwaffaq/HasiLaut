import Link from "next/link";
import { requireApprovedSellerPage } from "@/lib/auth-guards";
import {
  getSellerOrdersWithItems,
  getSellerOverviewStats,
} from "@/lib/queries/seller";
import {
  PAYMENT_METHOD_LABELS,
  formatDateTime,
  formatRupiah,
} from "@/lib/format";
import SessionSyncRedirect from "@/components/auth/SessionSyncRedirect";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";

export const metadata = {
  title: "Dashboard Seller",
  description: "Ringkasan operasional lapak, produk aktif, dan pesanan masuk.",
};

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const { store, needsSessionSync, syncTarget } =
    await requireApprovedSellerPage();

  if (needsSessionSync && syncTarget) {
    return <SessionSyncRedirect target={syncTarget} />;
  }

  if (!store) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorBanner message="Profil lapak belum ditemukan untuk akun Anda." />
      </div>
    );
  }

  const [stats, recentOrders] = await Promise.all([
    getSellerOverviewStats(store.id),
    getSellerOrdersWithItems(store.id, { limit: 5 }),
  ]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
            Dashboard {store.store_name}
          </h1>
          <p className="text-[16px] text-[#475569]">
            {store.dock_location || "Lokasi dermaga belum diisi"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/seller/dashboard/products/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985]"
          >
            Tambah Produk
          </Link>
          <Link
            href="/seller/dashboard/orders"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2.5 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            Kelola Pesanan
          </Link>
        </div>
      </div>

      <section aria-label="Ringkasan angka lapak">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
          <div className="p-6 space-y-1">
            <p className="text-[14px] font-medium text-[#475569]">
              Produk Aktif (Aktif & Stok &ge; 0,5 kg)
            </p>
            <p className="text-[28px] font-bold text-[#0F172A] tabular-nums">
              {stats.activeProducts}
            </p>
            <p className="text-[14px] text-[#64748B] tabular-nums">
              {stats.totalProducts} total produk terdaftar
            </p>
          </div>

          <div className="p-6 space-y-1">
            <p className="text-[14px] font-medium text-[#475569]">
              Pesanan Perlu Ditindaklanjuti
            </p>
            <p className="text-[28px] font-bold text-[#0284C7] tabular-nums">
              {stats.openOrders}
            </p>
            <p className="text-[14px] text-[#64748B]">
              Menunggu pembayaran, diproses, atau dikirim
            </p>
          </div>

          <div className="p-6 space-y-1">
            <p className="text-[14px] font-medium text-[#475569]">
              Total Penjualan Selesai
            </p>
            <p className="text-[28px] font-bold text-[#047857] tabular-nums">
              {formatRupiah(stats.completedRevenue)}
            </p>
            <p className="text-[14px] text-[#64748B] tabular-nums">
              Dari {stats.completedOrders} pesanan selesai
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="recent-orders-heading" className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="recent-orders-heading"
            className="text-[22px] font-semibold text-[#0F172A]"
          >
            Pesanan Masuk Terbaru
          </h2>
          <Link
            href="/seller/dashboard/orders"
            className="inline-flex min-h-[44px] items-center text-[15px] font-semibold text-[#0369A1] hover:underline"
          >
            Lihat Semua Pesanan
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <EmptyState
            title="Belum ada pesanan masuk"
            description="Pesanan terbaru dari pembeli akan muncul di sini."
            actionLabel="Kelola Produk Lapak"
            actionHref="/seller/dashboard/products"
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[14px] font-medium text-[#475569]">
                  <th className="py-3.5 px-5">Kode Pesanan</th>
                  <th className="py-3.5 px-4">Pembeli</th>
                  <th className="py-3.5 px-4">Pembayaran</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[15px]">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-4 px-5">
                      <p className="font-semibold text-[#0F172A] tabular-nums">
                        {order.order_code}
                      </p>
                      <p className="text-[13px] text-[#64748B]">
                        {formatDateTime(order.created_at)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-[#334155]">
                      {order.buyer_name}
                    </td>
                    <td className="py-4 px-4 text-[#475569]">
                      {PAYMENT_METHOD_LABELS[order.payment_method] ||
                        order.payment_method}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-5 text-right font-semibold text-[#0284C7] tabular-nums whitespace-nowrap">
                      {formatRupiah(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
