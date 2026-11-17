import { requireRolePage } from "@/lib/auth-guards";
import { getAdminUsers } from "@/lib/queries/admin";
import AdminUsersView from "@/components/admin/AdminUsersView";

export const metadata = {
  title: "Manajemen Pengguna",
  description:
    "Kelola akun Pembeli dan Penjual (Mitra Nelayan) secara terpisah di HasiLaut.",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const adminUser = await requireRolePage(["admin"]);
  const users = await getAdminUsers();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="space-y-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Manajemen Pengguna
        </h1>
        <p className="text-[16px] text-[#475569]">
          Kelola akun Pembeli dan Penjual (Mitra Nelayan) secara terpisah,
          perbarui kontak, atau hapus akun yang tidak lagi aktif.
        </p>
      </div>

      <AdminUsersView
        initialUsers={users}
        currentAdminId={adminUser.id}
      />
    </div>
  );
}
