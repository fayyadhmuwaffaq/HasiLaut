import { notFound } from "next/navigation";
import { requireApprovedSellerPage } from "@/lib/auth-guards";
import { getAllCategories } from "@/lib/queries/products";
import { getSellerProductById } from "@/lib/queries/seller";
import SessionSyncRedirect from "@/components/auth/SessionSyncRedirect";
import SellerProductForm from "@/components/seller/SellerProductForm";
import { ErrorBanner } from "@/components/ui/FeedbackStates";

export const metadata = {
  title: "Ubah Produk",
  description: "Perbarui informasi, harga per kg, stok, atau foto produk.",
};

export const dynamic = "force-dynamic";

export default async function SellerEditProductPage({ params }) {
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

  const { id } = await params;
  const [product, categories] = await Promise.all([
    getSellerProductById(id, store.id),
    getAllCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="space-y-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Ubah Produk: {product.name}
        </h1>
        <p className="text-[16px] text-[#475569]">
          Perbarui harga per kilogram, jumlah stok, deskripsi, atau unggah foto
          pengganti.
        </p>
      </div>

      {product.admin_disabled ? (
        <div
          role="status"
          className="rounded-lg border border-[#F59E0B] bg-[#FFFBEB] p-4 sm:p-5 text-left"
        >
          <p className="text-[15px] font-semibold text-[#92400E]">
            Produk Dinonaktifkan oleh Admin
          </p>
          <p className="mt-1 text-[14px] text-[#78350F]">
            Anda masih dapat memperbarui rincian produk, namun produk ini belum
            akan tampil di katalog pembeli sampai diaktifkan kembali oleh Admin.
          </p>
        </div>
      ) : null}

      <SellerProductForm categories={categories} initialProduct={product} />
    </div>
  );
}
