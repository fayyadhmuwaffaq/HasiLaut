import Link from "next/link";
import { requireApprovedSellerPage } from "@/lib/auth-guards";
import { getSellerProducts } from "@/lib/queries/seller";
import SessionSyncRedirect from "@/components/auth/SessionSyncRedirect";
import SellerProductsView from "@/components/seller/SellerProductsView";
import { ErrorBanner } from "@/components/ui/FeedbackStates";

export const metadata = {
  title: "Produk Lapak Seller",
  description: "Kelola katalog hasil laut, harga per kg, dan stok lapak Anda.",
};

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
  const { store, needsSessionSync, syncTarget } =
    await requireApprovedSellerPage();

  if (needsSessionSync && syncTarget) {
    return <SessionSyncRedirect target={syncTarget} />;
  }

  if (!store) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorBanner message="Profil lapak belum ditemukan." />
      </div>
    );
  }

  const products = await getSellerProducts(store.id);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
            Produk Lapak
          </h1>
          <p className="text-[16px] text-[#475569]">
            Tambahkan, perbarui stok kilogram, atau hapus produk hasil laut
            Anda.
          </p>
        </div>

        <Link
          href="/seller/dashboard/products/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] self-start sm:self-auto"
        >
          Tambah Produk
        </Link>
      </div>

      <SellerProductsView initialProducts={products} />
    </div>
  );
}
