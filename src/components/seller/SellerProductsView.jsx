"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import { formatKg, formatRupiah } from "@/lib/format";

export default function SellerProductsView({ initialProducts }) {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [togglingProductId, setTogglingProductId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleToggleActive(product) {
    const nextActive = product.is_active === false;
    setTogglingProductId(product.id);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/seller/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal mengubah status produk.");
        setTogglingProductId(null);
        return;
      }

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, is_active: nextActive } : item
        )
      );
      showSuccess(
        data?.message ||
          (nextActive
            ? `Produk "${product.name}" kembali diaktifkan.`
            : `Produk "${product.name}" dinonaktifkan dari etalase pembeli.`)
      );
      setTogglingProductId(null);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat mengubah status produk.");
      setTogglingProductId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

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
      showSuccess(`Produk "${deleteTarget.name}" telah dihapus.`);
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

      <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[14px] font-medium text-[#475569]">
              <th className="py-3.5 px-5">Produk</th>
              <th className="py-3.5 px-4">Kategori</th>
              <th className="py-3.5 px-4 text-right">Harga / Kg</th>
              <th className="py-3.5 px-4 text-right">Stok</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[15px]">
            {products.map((product) => {
              const isOutOfStock = product.stock_kg < 0.5;
              const isActive = product.is_active !== false;
              const isToggling = togglingProductId === product.id;

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
                          className={`h-full w-full object-cover ${
                            isActive ? "" : "opacity-60"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A]">
                          {product.name}
                        </p>
                        {!isActive ? (
                          <p className="text-[13px] font-medium text-[#B45309]">
                            Nonaktif (tersembunyi dari pembeli)
                          </p>
                        ) : isOutOfStock ? (
                          <p className="text-[13px] font-medium text-[#B91C1C]">
                            Stok habis
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
                  <td className="py-4 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      aria-label={
                        isActive
                          ? `Nonaktifkan produk ${product.name}`
                          : `Aktifkan produk ${product.name}`
                      }
                      disabled={isToggling}
                      onClick={() => handleToggleActive(product)}
                      className="inline-flex min-h-[44px] items-center gap-2.5 px-1 disabled:opacity-50"
                    >
                      <span
                        aria-hidden="true"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                          isActive ? "bg-[#0369A1]" : "bg-[#CBD5E1]"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-[#FFFFFF] shadow-sm transition-transform ${
                            isActive ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </span>
                      <span
                        className={`text-[14px] font-semibold ${
                          isActive ? "text-[#047857]" : "text-[#64748B]"
                        }`}
                      >
                        {isToggling
                          ? "Menyimpan..."
                          : isActive
                            ? "Aktif"
                            : "Nonaktif"}
                      </span>
                    </button>
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
