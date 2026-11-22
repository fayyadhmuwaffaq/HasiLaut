import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getDefaultHomeForUser } from "@/lib/auth-guards";
import { getPublicFeaturedProducts } from "@/lib/queries/products";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/ui/FeedbackStates";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user && (user.role === "admin" || user.role === "seller")) {
    redirect(getDefaultHomeForUser(user));
  }

  const isBuyer = user?.role === "buyer";
  const featuredProducts = await getPublicFeaturedProducts({ limit: 6 });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14 sm:space-y-16">
      <section className="max-w-[780px] space-y-6">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A] leading-tight">
          Hasil Laut Segar Langsung dari Nelayan & Mitra Pesisir
        </h1>
        <p className="max-w-[65ch] text-[16px] text-[#334155]">
          Belanja ikan, udang, cumi, dan olahan laut dengan harga transparan
          per kilogram mulai dari 0,5 kg, baik untuk dapur rumah tangga maupun
          pasokan usaha kuliner.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/products"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] transition-colors"
          >
            Lihat Katalog Produk
          </Link>

          <Link
            href={isBuyer ? "/buyer/home" : "/register"}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-5 py-2.5 text-[16px] font-medium text-[#0F172A] hover:border-[#0369A1] hover:text-[#0369A1] transition-colors"
          >
            {isBuyer ? "Beranda Pembeli" : "Daftar Akun"}
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="featured-catalog-heading"
        className="border-t border-[#E2E8F0] pt-12 space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2
              id="featured-catalog-heading"
              className="text-[22px] font-semibold text-[#0F172A]"
            >
              Pilihan Hasil Laut Terbaru
            </h2>
            <p className="mt-1 text-[16px] text-[#475569]">
              Produk aktif dari mitra nelayan yang telah diverifikasi Admin.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-semibold text-[#0F172A] hover:border-[#0369A1] hover:text-[#0369A1] transition-colors self-start sm:self-auto"
          >
            Lihat Semua Katalog
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                isBuyer={isBuyer}
                priorityImage={index === 0}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Belum ada produk hasil laut tersedia"
            description="Saat ini belum ada produk aktif dari mitra nelayan yang disetujui. Silakan periksa halaman katalog atau daftar sebagai mitra nelayan untuk mulai berjualan."
            actionLabel={isBuyer ? "Buka Halaman Katalog" : "Daftar sebagai Mitra Nelayan"}
            actionHref={isBuyer ? "/products" : "/register"}
          />
        )}
      </section>
    </div>
  );
}
