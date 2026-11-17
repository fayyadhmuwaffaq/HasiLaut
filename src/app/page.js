import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getDefaultHomeForUser } from "@/lib/auth-guards";
import {
  getAllCategories,
  getPublicFeaturedProducts,
} from "@/lib/queries/products";
import { formatKg, formatRupiah } from "@/lib/format";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/ui/FeedbackStates";
import { SearchIcon } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user && (user.role === "admin" || user.role === "seller")) {
    redirect(getDefaultHomeForUser(user));
  }

  const isBuyer = user?.role === "buyer";
  const [categories, featuredProducts] = await Promise.all([
    getAllCategories(),
    getPublicFeaturedProducts({ limit: 6 }),
  ]);

  const spotlightProduct = featuredProducts[0] ?? null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14 sm:space-y-16">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A] leading-tight">
            Hasil Laut Segar Langsung dari Nelayan & Mitra Pesisir
          </h1>
          <p className="max-w-[65ch] text-[16px] text-[#334155]">
            Belanja ikan, udang, cumi, dan olahan laut dengan harga transparan
            per kilogram mulai dari 0,5 kg, baik untuk dapur rumah tangga maupun
            pasokan usaha kuliner.
          </p>

          <form
            action="/products"
            method="GET"
            role="search"
            className="flex flex-col sm:flex-row gap-3 max-w-[540px]"
          >
            <div className="flex-1">
              <label htmlFor="home-search-q" className="sr-only">
                Cari produk hasil laut
              </label>
              <input
                id="home-search-q"
                name="q"
                type="search"
                placeholder="Cari ikan kakap, tongkol, udang..."
                className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] transition-colors"
            >
              <SearchIcon size={18} />
              <span>Cari Produk</span>
            </button>
          </form>

          {categories.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-[14px] font-medium text-[#475569]">
                Telusuri berdasarkan kategori:
              </p>
              <nav aria-label="Kategori hasil laut" className="flex flex-wrap gap-2.5">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${encodeURIComponent(category.slug)}`}
                    className="inline-flex min-h-[44px] items-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:border-[#0369A1] hover:text-[#0369A1] transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-5">
          {spotlightProduct ? (
            <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] overflow-hidden">
              <Link
                href={`/products/${spotlightProduct.id}`}
                className="block aspect-[4/3] w-full bg-[#F1F5F9] overflow-hidden"
              >
                <Image
                  src={
                    spotlightProduct.image_url ||
                    "/placeholders/seafood-placeholder.svg"
                  }
                  alt={spotlightProduct.name}
                  width={800}
                  height={600}
                  preload
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="p-5 space-y-2">
                <p className="text-[14px] text-[#475569]">
                  {spotlightProduct.store_name}
                  {spotlightProduct.dock_location
                    ? ` · ${spotlightProduct.dock_location}`
                    : ""}
                </p>
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/products/${spotlightProduct.id}`}
                    className="text-[18px] font-semibold text-[#0F172A] hover:text-[#0369A1]"
                  >
                    {spotlightProduct.name}
                  </Link>
                  <p className="tabular-nums shrink-0">
                    <span className="text-[18px] font-bold text-[#0284C7]">
                      {formatRupiah(spotlightProduct.price_per_kg)}
                    </span>{" "}
                    <span className="text-[14px] text-[#64748B]">/ kg</span>
                  </p>
                </div>
                <p className="text-[14px] text-[#475569] tabular-nums">
                  Tersedia {formatKg(spotlightProduct.stock_kg)}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] overflow-hidden">
              <Image
                src="/placeholders/seafood-placeholder.svg"
                alt="Tempat foto hasil laut segar HasiLaut"
                width={800}
                height={600}
                preload
                fetchPriority="high"
                className="w-full aspect-[4/3] object-cover"
              />
              <p className="p-4 text-[14px] text-[#475569]">
                Foto hasil tangkapan terbaru akan tampil di sini setelah mitra
                nelayan menambahkan produk.
              </p>
            </div>
          )}
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
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isBuyer={isBuyer}
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
