"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import { formatKg, formatRupiah } from "@/lib/format";

export default function SellerProductsView({ initialProducts }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`/api/seller/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal menghapus produk.");
        setDeleting(false);
        setDeleteTarget(null);
        return;
      }

      setProducts((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setStatusMessage(`Produk "${deleteTarget.name}" telah dihapus.`);
      setDeleting(false);
      setDeleteTarget(null);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat menghapus produk.");
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="Belum ada produk di lapak Anda"
        description="Tambahkan produk hasil tangkapan beserta foto dan harga per kilogram agar pembeli dapat langsung memesan."
        actionLabel="Tambah Produk Pertama"
        actionHref="/seller/dashboard/products/new"
      />
    );
  }

  return (
    <div className="space-y-5">
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {statusMessage ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-[#047857]/30 bg-[#ECFDF5] px-4 py-3 text-[15px] font-medium text-[#047857]"
        >
          {statusMessage}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[14px] font-medium text-[#475569]">
              <th className="py-3.5 px-5">Produk</th>
              <th className="py-3.5 px-4">Kategori</th>
              <th className="py-3.5 px-4 text-right">Harga / Kg</th>
              <th className="py-3.5 px-4 text-right">Stok</th>
              <th className="py-3.5 px-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[15px]">
            {products.map((product) => {
              const isOutOfStock = product.stock_kg < 0.5;
              return (
                <tr key={product.id}>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-4 min-w-[220px]">
                      <div className="h-14 w-[74px] shrink-0 rounded-md border border-[#E2E8F0] bg-[#F1F5F9] overflow-hidden">
                        <Image
                          src={
                            product.image_url ||
                            "/placeholders/seafood-placeholder.svg"
                          }
                          alt={product.name}
                          width={96}
                          height={72}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A]">
                          {product.name}
                        </p>
                        {isOutOfStock ? (
                          <p className="text-[13px] font-medium text-[#B91C1C]">
                            Nonaktif / stok habis
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[#475569] whitespace-nowrap">
                    {product.category_name}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-[#0284C7] tabular-nums whitespace-nowrap">
                    {formatRupiah(product.price_per_kg)}
                  </td>
                  <td
                    className={`py-4 px-4 text-right font-medium tabular-nums whitespace-nowrap ${
                      isOutOfStock ? "text-[#B91C1C]" : "text-[#0F172A]"
                    }`}
                  >
                    {formatKg(product.stock_kg)}
                  </td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2.5">
                      <Link
                        href={`/seller/dashboard/products/${product.id}/edit`}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[14px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                      >
                        Ubah
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-4 py-2 text-[14px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2]"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Produk"
        description={`Produk "${
          deleteTarget?.name || ""
        }" akan dihapus dari katalog lapak Anda.`}
        confirmLabel="Ya, Hapus Produk"
        cancelLabel="Batal"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
