import { requireApprovedSellerPage } from "@/lib/auth-guards";
import { getAllCategories } from "@/lib/queries/products";
import SessionSyncRedirect from "@/components/auth/SessionSyncRedirect";
import SellerProductForm from "@/components/seller/SellerProductForm";
import { ErrorBanner } from "@/components/ui/FeedbackStates";

export const metadata = {
  title: "Tambah Produk Baru",
  description: "Tambahkan hasil laut baru ke katalog lapak Anda.",
};

export const dynamic = "force-dynamic";

export default async function SellerNewProductPage() {
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

  const categories = await getAllCategories();

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="space-y-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Tambah Produk Baru
        </h1>
        <p className="text-[16px] text-[#475569]">
          Lengkapi nama hasil laut, harga per kg, stok tersedia, deskripsi, dan
          foto produk.
        </p>
      </div>

      <SellerProductForm categories={categories} />
    </div>
  );
}
