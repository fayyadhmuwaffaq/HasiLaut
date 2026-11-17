import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getDefaultHomeForUser } from "@/lib/auth-guards";
import { getProductDetailById } from "@/lib/queries/products";
import { formatDateTime, formatKg, formatRupiah } from "@/lib/format";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import { EmptyState } from "@/components/ui/FeedbackStates";
import { StarIcon } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const detail = await getProductDetailById(id);

  if (!detail) {
    return {
      title: "Produk Tidak Ditemukan",
    };
  }

  return {
    title: detail.product.name,
    description: `${detail.product.name} dari ${detail.product.store_name} (${formatRupiah(detail.product.price_per_kg)} / kg).`,
  };
}

export default async function ProductDetailPage({ params }) {
  const user = await getCurrentUser();
  if (user && (user.role === "admin" || user.role === "seller")) {
    redirect(getDefaultHomeForUser(user));
  }

  const isBuyer = user?.role === "buyer";
  const { id } = await params;
  const detail = await getProductDetailById(id);

  if (!detail) {
    notFound();
  }

  const { product, reviews } = detail;
  const stockKg = Number(product.stock_kg);
  const isOutOfStock = !Number.isFinite(stockKg) || stockKg < 0.5;
  const imageSrc = product.image_url || "/placeholders/seafood-placeholder.svg";

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      <nav aria-label="Breadcrumb" className="text-[14px] text-[#475569] flex flex-wrap items-center gap-2">
        <Link href="/products" className="hover:text-[#0369A1] py-1">
          Katalog
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/products?category=${encodeURIComponent(product.category_slug)}`}
          className="hover:text-[#0369A1] py-1"
        >
          {product.category_name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-[#0F172A]">{product.name}</span>
      </nav>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-6">
          <div className="aspect-[4/3] w-full rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] overflow-hidden">
            <Image
              src={imageSrc}
              alt={product.name}
              width={1200}
              height={900}
              preload
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <p className="text-[14px] font-medium text-[#475569]">
              {product.category_name}
            </p>
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A] leading-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-[14px] text-[#475569]">
              {product.review_count > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-[#0F172A] tabular-nums">
                  <StarIcon size={16} filled className="text-[#B45309]" />
                  <span>
                    {Number(product.avg_rating).toFixed(1)} dari 5 ({product.review_count} ulasan)
                  </span>
                </span>
              ) : (
                <span>Belum ada ulasan pembeli</span>
              )}
            </div>
          </div>

          <div className="border-y border-[#E2E8F0] py-5 flex flex-wrap items-baseline justify-between gap-4">
            <p className="tabular-nums">
              <span className="text-[28px] font-bold text-[#0284C7]">
                {formatRupiah(product.price_per_kg)}
              </span>{" "}
              <span className="text-[15px] text-[#64748B]">/ kg</span>
            </p>
            <p
              className={`text-[15px] font-semibold tabular-nums ${
                isOutOfStock ? "text-[#B91C1C]" : "text-[#047857]"
              }`}
            >
              {isOutOfStock ? "Stok habis" : `Stok tersedia: ${formatKg(stockKg)}`}
            </p>
          </div>

          <ProductPurchasePanel
            productId={product.id}
            productName={product.name}
            pricePerKg={product.price_per_kg}
            stockKg={stockKg}
            isBuyer={isBuyer}
          />

          <div className="border-t border-[#E2E8F0] pt-5 flex items-start gap-4">
            <div className="h-16 w-20 shrink-0 rounded-md border border-[#E2E8F0] bg-[#F1F5F9] overflow-hidden">
              <Image
                src={
                  product.store_image_url ||
                  "/placeholders/store-placeholder.svg"
                }
                alt={`Foto lapak ${product.store_name}`}
                width={160}
                height={120}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-[14px] text-[#475569]">Lapak Nelayan</p>
              <p className="text-[16px] font-semibold text-[#0F172A]">
                {product.store_name}
              </p>
              {product.dock_location ? (
                <p className="text-[14px] text-[#475569]">
                  Lokasi Dermaga: {product.dock_location}
                </p>
              ) : null}
              {product.store_description ? (
                <p className="text-[14px] text-[#475569] max-w-[55ch]">
                  {product.store_description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="product-desc-heading"
        className="border-t border-[#E2E8F0] pt-10 space-y-3"
      >
        <h2
          id="product-desc-heading"
          className="text-[22px] font-semibold text-[#0F172A]"
        >
          Deskripsi Kondisi & Ukuran
        </h2>
        <p className="max-w-[68ch] whitespace-pre-line text-[16px] leading-[1.6] text-[#334155]">
          {product.description}
        </p>
      </section>

      <section
        aria-labelledby="product-reviews-heading"
        className="border-t border-[#E2E8F0] pt-10 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="product-reviews-heading"
            className="text-[22px] font-semibold text-[#0F172A]"
          >
            Ulasan Pembeli ({reviews.length})
          </h2>
        </div>

        {reviews.length > 0 ? (
          <ul className="divide-y divide-[#E2E8F0] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
            {reviews.map((review) => (
              <li key={review.id} className="p-5 sm:p-6 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[16px] font-semibold text-[#0F172A]">
                    {review.reviewer_name}
                  </p>
                  <p className="text-[14px] text-[#64748B]">
                    {formatDateTime(review.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[#B45309] tabular-nums">
                  <StarIcon size={16} filled />
                  <span>Rating {review.rating} / 5</span>
                </div>
                {review.comment ? (
                  <p className="max-w-[68ch] text-[16px] text-[#334155]">
                    {review.comment}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Belum ada ulasan untuk produk ini"
            description="Ulasan hanya dapat diberikan oleh pembeli setelah transaksi selesai."
          />
        )}
      </section>
    </div>
  );
}
