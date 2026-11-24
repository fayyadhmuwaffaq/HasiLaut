import { requireApprovedSellerPage } from "@/lib/auth-guards";
import { getSellerOrdersWithItems } from "@/lib/queries/seller";
import SessionSyncRedirect from "@/components/auth/SessionSyncRedirect";
import SellerOrdersView from "@/components/seller/SellerOrdersView";
import { ErrorBanner } from "@/components/ui/FeedbackStates";

export const metadata = {
  title: "Pesanan Masuk Seller",
  description: "Kelola dan perbarui status pesanan masuk lapak Anda.",
};

export const dynamic = "force-dynamic";

export default async function SellerOrdersPage({ searchParams }) {
  const { store, needsSessionSync, syncTarget } =
    await requireApprovedSellerPage();

  if (needsSessionSync && syncTarget) {
    return <SessionSyncRedirect target={syncTarget} />;
  }

  if (!store) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12">
        <ErrorBanner message="Profil lapak belum ditemukan." />
      </div>
    );
  }

  const resolvedParams = await searchParams;
  const initialTab =
    typeof resolvedParams?.status === "string"
      ? resolvedParams.status.trim()
      : "all";

  const orders = await getSellerOrdersWithItems(store.id);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="space-y-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Pesanan Masuk
        </h1>
        <p className="text-[16px] text-[#475569]">
          Perbarui status pesanan secara berurutan dari Menunggu Pembayaran
          hingga Selesai.
        </p>
      </div>

      <SellerOrdersView initialOrders={orders} initialTab={initialTab} />
    </div>
  );
}
