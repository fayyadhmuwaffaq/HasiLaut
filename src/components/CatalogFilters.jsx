"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function buildClearKeywordHref(initialFilters) {
  const params = new URLSearchParams();
  if (initialFilters.category) {
    params.set("category", initialFilters.category);
  }
  if (initialFilters.minPrice) {
    params.set("minPrice", initialFilters.minPrice);
  }
  if (initialFilters.maxPrice) {
    params.set("maxPrice", initialFilters.maxPrice);
  }
  if (initialFilters.sort && initialFilters.sort !== "newest") {
    params.set("sort", initialFilters.sort);
  }
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

export default function CatalogFilters({ categories, initialFilters }) {
  const router = useRouter();
  const [category, setCategory] = useState(initialFilters.category || "");
  const [sort, setSort] = useState(initialFilters.sort || "newest");

  const hasActiveFilters = Boolean(
    initialFilters.q ||
      initialFilters.category ||
      (initialFilters.sort && initialFilters.sort !== "newest")
  );
  const clearKeywordHref = buildClearKeywordHref(initialFilters);

  function handleSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (initialFilters.q) {
      params.set("q", initialFilters.q);
    }
    if (category) {
      params.set("category", category);
    }
    if (initialFilters.minPrice) {
      params.set("minPrice", initialFilters.minPrice);
    }
    if (initialFilters.maxPrice) {
      params.set("maxPrice", initialFilters.maxPrice);
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
      {initialFilters.q ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#0369A1]/25 bg-[#F0F9FF] px-3.5 py-2.5 text-[14px]">
          <p className="text-[#0F172A]">
            Kata kunci pencarian:{" "}
            <span className="font-semibold text-[#0369A1]">
              &ldquo;{initialFilters.q}&rdquo;
            </span>
          </p>
          <Link
            href={clearKeywordHref}
            className="inline-flex min-h-[44px] items-center font-semibold text-[#0369A1] hover:underline whitespace-nowrap"
          >
            Hapus kata kunci
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
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

        <div className="lg:col-span-4">
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

        <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center lg:justify-end gap-3">
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] transition-colors whitespace-nowrap"
          >
            Terapkan Filter
          </button>

          {hasActiveFilters ? (
            <Link
              href="/products"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2.5 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors whitespace-nowrap"
            >
              Reset Filter
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}
