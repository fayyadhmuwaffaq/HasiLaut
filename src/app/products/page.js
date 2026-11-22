import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getDefaultHomeForUser } from "@/lib/auth-guards";
import { getAllCategories, searchProducts } from "@/lib/queries/products";
import CatalogFilters from "@/components/CatalogFilters";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/ui/FeedbackStates";

export const metadata = {
  title: "Katalog Hasil Laut",
  description:
    "Cari hasil laut segar, saring kategori, dan urutkan penawaran terbaik dari mitra nelayan.",
};

export const dynamic = "force-dynamic";

function buildPageHref(filters, targetPage) {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.category) {
    params.set("category", filters.category);
  }
  if (filters.minPrice !== "") {
    params.set("minPrice", filters.minPrice);
  }
  if (filters.maxPrice !== "") {
    params.set("maxPrice", filters.maxPrice);
  }
  if (filters.sort && filters.sort !== "newest") {
    params.set("sort", filters.sort);
  }
  if (targetPage > 1) {
    params.set("page", String(targetPage));
  }
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

export default async function ProductsCatalogPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user && (user.role === "admin" || user.role === "seller")) {
    redirect(getDefaultHomeForUser(user));
  }

  const isBuyer = user?.role === "buyer";
  const resolved = await searchParams;

  const q = typeof resolved?.q === "string" ? resolved.q.trim() : "";
  const category =
    typeof resolved?.category === "string" ? resolved.category.trim() : "";
  const rawMin =
    typeof resolved?.minPrice === "string" ? resolved.minPrice.trim() : "";
  const rawMax =
    typeof resolved?.maxPrice === "string" ? resolved.maxPrice.trim() : "";
  const sort =
    resolved?.sort === "price_asc" || resolved?.sort === "price_desc"
      ? resolved.sort
      : "newest";
  const page = Math.max(1, Number.parseInt(resolved?.page || "1", 10) || 1);

  const minPriceNum =
    rawMin !== "" && Number.isFinite(Number(rawMin)) && Number(rawMin) >= 0
      ? Number(rawMin)
      : null;
  const maxPriceNum =
    rawMax !== "" && Number.isFinite(Number(rawMax)) && Number(rawMax) >= 0
      ? Number(rawMax)
      : null;

  const initialFilters = {
    q,
    category,
    minPrice: minPriceNum !== null ? String(minPriceNum) : "",
    maxPrice: maxPriceNum !== null ? String(maxPriceNum) : "",
    sort,
  };

  const [categories, catalog] = await Promise.all([
    getAllCategories(),
    searchProducts({
      q,
      categorySlug: category,
      minPrice: minPriceNum,
      maxPrice: maxPriceNum,
      sort,
      page,
      pageSize: 12,
    }),
  ]);

  const filterKey = `${q}|${category}|${initialFilters.minPrice}|${initialFilters.maxPrice}|${sort}`;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="space-y-2">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Katalog Hasil Laut
        </h1>
        <p className="max-w-[65ch] text-[16px] text-[#475569]">
          Gunakan pencarian di bilah atas atau saring hasil tangkapan segar
          berdasarkan kategori dan urutan harga per kilogram.
        </p>
      </div>

      <CatalogFilters
        key={filterKey}
        categories={categories}
        initialFilters={initialFilters}
      />

      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 text-[14px] text-[#475569] tabular-nums">
        <p>
          Menampilkan {catalog.products.length} dari {catalog.totalCount} produk
        </p>
        {catalog.totalPages > 1 ? (
          <p>
            Halaman {catalog.currentPage} dari {catalog.totalPages}
          </p>
        ) : null}
      </div>

      {catalog.products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {catalog.products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                isBuyer={isBuyer}
                priorityImage={index === 0}
              />
            ))}
          </div>

          {catalog.totalPages > 1 ? (
            <nav
              aria-label="Navigasi halaman katalog"
              className="flex items-center justify-between border-t border-[#E2E8F0] pt-6"
            >
              {catalog.currentPage > 1 ? (
                <Link
                  href={buildPageHref(initialFilters, catalog.currentPage - 1)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:border-[#0369A1] hover:text-[#0369A1]"
                >
                  Sebelumnya
                </Link>
              ) : (
                <span className="inline-flex min-h-[44px] items-center rounded-md border border-[#E2E8F0] bg-[#F1F5F9] px-4 py-2 text-[15px] text-[#64748B]">
                  Sebelumnya
                </span>
              )}

              {catalog.currentPage < catalog.totalPages ? (
                <Link
                  href={buildPageHref(initialFilters, catalog.currentPage + 1)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:border-[#0369A1] hover:text-[#0369A1]"
                >
                  Berikutnya
                </Link>
              ) : (
                <span className="inline-flex min-h-[44px] items-center rounded-md border border-[#E2E8F0] bg-[#F1F5F9] px-4 py-2 text-[15px] text-[#64748B]">
                  Berikutnya
                </span>
              )}
            </nav>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="Tidak ada produk yang sesuai"
          description="Coba ubah kata kunci pencarian atau pilih kategori hasil laut lainnya."
          actionLabel="Reset Semua Filter"
          actionHref="/products"
        />
      )}
    </div>
  );
}
