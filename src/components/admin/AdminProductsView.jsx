"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import { formatKg, formatRupiah } from "@/lib/format";

export default function AdminProductsView({ initialProducts }) {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal menghapus produk.");
        setDeleting(false);
        setDeleteTarget(null);
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showSuccess(
        data?.message || `Produk "${deleteTarget.name}" telah dihapus.`
      );
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
        title="Belum ada produk di platform"
        description="Daftar seluruh produk hasil laut dari mitra nelayan akan muncul di sini untuk moderasi."
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
              <th className="py-3.5 px-5">Produk & Kategori</th>
              <th className="py-3.5 px-4">Lapak & Status Mitra</th>
              <th className="py-3.5 px-4 text-right">Harga / Kg</th>
              <th className="py-3.5 px-4 text-right">Stok</th>
              <th className="py-3.5 px-5 text-right">Moderasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-[15px]">
            {products.map((product) => (
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
                    <div>
                      <p className="font-semibold text-[#0F172A]">
                        {product.name}
                      </p>
                      <p className="text-[14px] text-[#475569]">
                        {product.category_name}
                      </p>
                      {product.is_active === false ? (
                        <p className="mt-1 inline-flex rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[12px] font-medium text-[#475569]">
                          Dinonaktifkan Penjual
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <p className="font-medium text-[#0F172A]">
                    {product.store_name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      variant="seller"
                      status={product.seller_status}
                    />
                    {product.dock_location ? (
                      <span className="text-[13px] text-[#64748B]">
                        {product.dock_location}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-semibold text-[#0284C7] tabular-nums whitespace-nowrap">
                  {formatRupiah(product.price_per_kg)}
                </td>
                <td className="py-4 px-4 text-right text-[#0F172A] tabular-nums whitespace-nowrap">
                  {formatKg(product.stock_kg)}
                </td>
                <td className="py-4 px-5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(product)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-4 py-2 text-[14px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2]"
                  >
                    Hapus Produk
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Produk (Moderasi)"
        description={`Produk "${deleteTarget?.name || ""}" dari lapak "${
          deleteTarget?.store_name || ""
        }" akan dihapus dari platform.`}
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
