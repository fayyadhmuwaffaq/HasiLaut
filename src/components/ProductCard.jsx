import Image from "next/image";
import Link from "next/link";
import { formatKg, formatRupiah } from "@/lib/format";
import AddToCartButton from "@/components/AddToCartButton";
import { StarIcon } from "@/components/ui/Icons";

export default function ProductCard({ product, isBuyer = false, priorityImage = false }) {
  const imageSrc = product.image_url || "/placeholders/seafood-placeholder.svg";
  const stockKg = Number(product.stock_kg);
  const isOutOfStock = !Number.isFinite(stockKg) || stockKg < 0.5;
  const storeMeta = product.dock_location
    ? `${product.store_name} · ${product.dock_location}`
    : product.store_name;

  return (
    <article className="flex flex-col rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] overflow-hidden">
      <Link
        href={`/products/${product.id}`}
        className="block aspect-[4/3] w-full bg-[#F1F5F9] overflow-hidden"
      >
        <Image
          src={imageSrc}
          alt={product.name}
          width={800}
          height={600}
          preload={priorityImage}
          fetchPriority={priorityImage ? "high" : undefined}
          className="h-full w-full object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-medium text-[#475569]">
            {product.category_name}
          </span>
          {product.review_count > 0 ? (
            <span className="inline-flex items-center gap-1 text-[14px] font-medium text-[#334155] tabular-nums">
              <StarIcon size={15} filled className="text-[#B45309]" />
              <span>{Number(product.avg_rating).toFixed(1)}</span>
              <span className="text-[#64748B]">({product.review_count})</span>
            </span>
          ) : null}
        </div>

        <h3 className="mt-1.5 text-[18px] font-semibold text-[#0F172A] leading-snug">
          <Link
            href={`/products/${product.id}`}
            className="hover:text-[#0369A1] transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 text-[14px] text-[#475569]">{storeMeta}</p>

        <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-baseline justify-between gap-3">
          <p className="tabular-nums">
            <span className="text-[20px] font-bold text-[#0284C7]">
              {formatRupiah(product.price_per_kg)}
            </span>{" "}
            <span className="text-[14px] text-[#64748B]">/ kg</span>
          </p>
          <p
            className={`text-[14px] font-medium tabular-nums ${
              isOutOfStock ? "text-[#B91C1C]" : "text-[#475569]"
            }`}
          >
            {isOutOfStock ? "Stok habis" : `Stok ${formatKg(stockKg)}`}
          </p>
        </div>

        <div className="mt-4 pt-1">
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            stockKg={stockKg}
            isBuyer={isBuyer}
          />
        </div>
      </div>
    </article>
  );
}
