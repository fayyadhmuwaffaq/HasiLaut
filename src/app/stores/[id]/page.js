import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getDefaultHomeForUser } from "@/lib/auth-guards";
import { getPublicStoreById } from "@/lib/queries/products";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/ui/FeedbackStates";
import { VerifiedIcon } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

function buildStoreHref(storeId, page) {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `/stores/${storeId}?${qs}` : `/stores/${storeId}`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getPublicStoreById(id, { pageSize: 1 });

  if (!data) {
    return {
      title: "Lapak Tidak Ditemukan",
    };
  }

  const { store } = data;
  return {
    title: store.store_name,
    description:
      store.description ||
      `Lihat produk hasil laut segar dari ${store.store_name}${
        store.dock_location ? ` (${store.dock_location})` : ""
      } di HasiLaut.`,
  };
}

export default async function StoreDetailPage({ params, searchParams }) {
  const user = await getCurrentUser();
  if (user && (user.role === "admin" || user.role === "seller")) {
    redirect(getDefaultHomeForUser(user));
  }

  const isBuyer = user?.role === "buyer";
  const { id } = await params;
  const resolved = await searchParams;
  const page = Math.max(1, Number.parseInt(resolved?.page || "1", 10) || 1);

  const data = await getPublicStoreById(id, { page, pageSize: 12 });
  if (!data) {
    notFound();
  }

  const { store, products, totalCount, totalPages, currentPage } = data;
  const storeImageSrc =
    store.store_image_url || "/placeholders/store-placeholder.svg";

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
      <nav
        aria-label="Breadcrumb"
        className="text-[14px] text-[#475569] flex flex-wrap items-center gap-2"
      >
        <Link href="/" className="hover:text-[#0369A1] py-1">
          Beranda
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/products" className="hover:text-[#0369A1] py-1">
          Katalog
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-[#0F172A]">{store.store_name}</span>
      </nav>

      <section
        aria-label={`Profil lapak ${store.store_name}`}
        className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8"
      >
        <div className="flex flex-col md:flex-row items-start gap-6 sm:gap-8">
          <div className="h-28 w-28 sm:h-36 sm:w-36 shrink-0 rounded-full border border-[#E2E8F0] bg-[#F1F5F9] overflow-hidden">
            <Image
              src={storeImageSrc}
              alt={`Foto lapak ${store.store_name}`}
              width={288}
              height={288}
              preload
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-1.5">
              <h1 className="inline-flex flex-wrap items-center gap-2.5 text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A] leading-tight">
                <span>{store.store_name}</span>
                <span
                  role="img"
                  aria-label="Toko terverifikasi"
                  title="Toko terverifikasi"
                  className="inline-flex items-center text-[#0369A1]"
                >
                  <VerifiedIcon size={24} />
                </span>
              </h1>
              <p className="text-[15px] text-[#475569]">
                Dikelola oleh{" "}
                <span className="font-medium text-[#0F172A]">
                  {store.owner_name}
                </span>
                {store.dock_location ? ` · ${store.dock_location}` : ""}
              </p>
            </div>

            {store.description ? (
              <p className="max-w-[65ch] whitespace-pre-line text-[16px] leading-[1.6] text-[#334155]">
                {store.description}
              </p>
            ) : (
              <p className="max-w-[65ch] text-[15px] text-[#64748B]">
                Menyediakan hasil tangkapan laut segar dalam satuan kilogram
                dari mitra terverifikasi HasiLaut.
              </p>
            )}

            <div className="border-t border-[#E2E8F0] pt-4 flex flex-wrap gap-6 text-[14px] text-[#475569] tabular-nums">
              <p>
                Total Produk:{" "}
                <span className="font-semibold text-[#0F172A]">
                  {store.total_products}
                </span>
              </p>
              <p>
                Tersedia Siap Kirim:{" "}
                <span className="font-semibold text-[#047857]">
                  {store.available_products}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="store-products-heading" className="space-y-6">
        <div className="border-b border-[#E2E8F0] pb-4">
          <h2
            id="store-products-heading"
            className="text-[22px] font-semibold text-[#0F172A]"
          >
            Produk dari {store.store_name}
          </h2>
          <p className="mt-1 text-[14px] text-[#475569] tabular-nums">
            Menampilkan {products.length} dari {totalCount} produk
          </p>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isBuyer={isBuyer}
                  priorityImage={index === 0}
                  showStoreLink={false}
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav
                aria-label="Navigasi halaman produk toko"
                className="flex items-center justify-between border-t border-[#E2E8F0] pt-6"
              >
                {currentPage > 1 ? (
                  <Link
                    href={buildStoreHref(store.id, currentPage - 1)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:border-[#0369A1] hover:text-[#0369A1]"
                  >
                    Sebelumnya
                  </Link>
                ) : (
                  <span className="inline-flex min-h-[44px] items-center rounded-md border border-[#E2E8F0] bg-[#F1F5F9] px-4 py-2 text-[15px] text-[#64748B]">
                    Sebelumnya
                  </span>
                )}

                {currentPage < totalPages ? (
                  <Link
                    href={buildStoreHref(store.id, currentPage + 1)}
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
            title="Lapak ini belum memiliki produk"
            description="Mitra nelayan ini belum menayangkan produk hasil laut. Jelajahi katalog utama untuk melihat penawaran dari mitra lainnya."
            actionLabel="Buka Katalog Utama"
            actionHref="/products"
          />
        )}
      </section>
    </div>
  );
}
