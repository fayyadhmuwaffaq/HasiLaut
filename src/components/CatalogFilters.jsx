"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CatalogFilters({
  categories,
  initialFilters,
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialFilters.q || "");
  const [category, setCategory] = useState(initialFilters.category || "");
  const [sort, setSort] = useState(initialFilters.sort || "newest");

  const hasActiveFilters = Boolean(
    initialFilters.q ||
      initialFilters.category ||
      (initialFilters.sort && initialFilters.sort !== "newest")
  );

  function handleSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (q.trim()) {
      params.set("q", q.trim());
    }
    if (category) {
      params.set("category", category);
    }
    if (sort && sort !== "newest") {
      params.set("sort", sort);
    }

    const queryStr = params.toString();
    router.push(queryStr ? `/products?${queryStr}` : "/products");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 sm:p-6 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
        <div className="sm:col-span-2 lg:col-span-5">
          <label
            htmlFor="filter-q"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Kata Kunci Produk / Lapak
          </label>
          <input
            id="filter-q"
            name="q"
            type="search"
            placeholder="Contoh: tongkol, udang..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
          />
        </div>

        <div className="lg:col-span-4">
          <label
            htmlFor="filter-category"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Kategori
          </label>
          <select
            id="filter-category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[16px] text-[#0F172A] focus:border-[#0284C7]"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label
            htmlFor="filter-sort"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Urutkan
          </label>
          <select
            id="filter-sort"
            name="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[16px] text-[#0F172A] focus:border-[#0284C7]"
          >
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] transition-colors"
        >
          Terapkan Filter
        </button>

        {hasActiveFilters ? (
          <Link
            href="/products"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2.5 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          >
            Reset Filter
          </Link>
        ) : null}
      </div>
    </form>
  );
}
