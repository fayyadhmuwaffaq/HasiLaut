import Link from "next/link";
import { requireRolePage } from "@/lib/auth-guards";
import {
  getAllCategories,
  getBuyerRecommendedProducts,
} from "@/lib/queries/products";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/ui/FeedbackStates";
import { SearchIcon } from "@/components/ui/Icons";

export const metadata = {
  title: "Beranda Pembeli",
  description: "Rekomendasi hasil laut segar untuk akun Pembeli HasiLaut.",
};

export const dynamic = "force-dynamic";

export default async function BuyerHomePage() {
  const user = await requireRolePage(["buyer"]);
  const [categories, recommendedProducts] = await Promise.all([
    getAllCategories(),
    getBuyerRecommendedProducts({ limit: 6 }),
  ]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      <section className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
              Selamat Datang, {user.full_name}
            </h1>
            <p className="max-w-[65ch] text-[16px] text-[#475569]">
              Cari hasil laut segar per kilogram atau pilih langsung dari
              rekomendasi stok yang tersedia hari ini.
            </p>
          </div>

          <form
            action="/products"
            method="GET"
            role="search"
            className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-[460px]"
          >
            <div className="flex-1">
              <label htmlFor="buyer-home-search" className="sr-only">
                Cari hasil laut
              </label>
              <input
                id="buyer-home-search"
                name="q"
                type="search"
                placeholder="Cari ikan, udang, cumi..."
                className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-md bg-[#0369A1] px-5 py-2.5 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] transition-colors"
            >
              <SearchIcon size={18} />
              <span>Cari Produk</span>
            </button>
          </form>
        </div>

        {categories.length > 0 ? (
          <div className="border-t border-[#E2E8F0] pt-5 flex flex-wrap items-center gap-2.5">
            <span className="text-[14px] font-medium text-[#475569] mr-1">
              Kategori:
            </span>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${encodeURIComponent(category.slug)}`}
                className="inline-flex min-h-[44px] items-center rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-[14px] font-medium text-[#0F172A] hover:border-[#0369A1] hover:text-[#0369A1] transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section aria-labelledby="buyer-rec-heading" className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2
              id="buyer-rec-heading"
              className="text-[22px] font-semibold text-[#0F172A]"
            >
              Rekomendasi Hasil Laut Hari Ini
            </h2>
            <p className="mt-1 text-[16px] text-[#475569]">
              Menampilkan pilihan produk acak dengan stok minimal 0,5 kg.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-semibold text-[#0F172A] hover:border-[#0369A1] hover:text-[#0369A1] transition-colors self-start sm:self-auto"
          >
            Buka Katalog Lengkap
          </Link>
        </div>

        {recommendedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                isBuyer
                priorityImage={index === 0}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Belum ada rekomendasi produk tersedia"
            description="Belum ada produk berstatus tersedia dari mitra nelayan yang disetujui. Silakan periksa kembali seluruh katalog secara berkala."
            actionLabel="Buka Katalog Lengkap"
            actionHref="/products"
          />
        )}
      </section>
    </div>
  );
}
