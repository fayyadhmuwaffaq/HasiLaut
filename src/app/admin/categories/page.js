import { requireRolePage } from "@/lib/auth-guards";
import { getAdminCategories } from "@/lib/queries/admin";
import AdminCategoriesView from "@/components/admin/AdminCategoriesView";

export const metadata = {
  title: "Kelola Kategori",
  description: "Tambah, ubah, dan hapus kategori produk hasil laut.",
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireRolePage(["admin"]);
  const categories = await getAdminCategories();

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="space-y-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Kelola Kategori Hasil Laut
        </h1>
        <p className="text-[16px] text-[#475569]">
          Kategori yang masih digunakan oleh produk tidak dapat dihapus demi
          menjaga integritas katalog.
        </p>
      </div>

      <AdminCategoriesView initialCategories={categories} />
    </div>
  );
}
