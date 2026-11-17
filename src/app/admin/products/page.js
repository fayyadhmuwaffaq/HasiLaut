import { requireRolePage } from "@/lib/auth-guards";
import { getAdminProducts } from "@/lib/queries/admin";
import AdminProductsView from "@/components/admin/AdminProductsView";

export const metadata = {
  title: "Moderasi Produk",
  description: "Tinjau dan moderasi produk dari seluruh lapak mitra.",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireRolePage(["admin"]);
  const products = await getAdminProducts();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="space-y-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Moderasi Produk Platform
        </h1>
        <p className="text-[16px] text-[#475569]">
          Periksa seluruh produk hasil laut dari semua lapak dan hapus produk
          yang melanggar ketentuan.
        </p>
      </div>

      <AdminProductsView initialProducts={products} />
    </div>
  );
}
