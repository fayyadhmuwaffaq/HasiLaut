import Link from "next/link";
import { requireRolePage } from "@/lib/auth-guards";
import {
  getAdminOverviewStats,
  getAdminSellerQueue,
} from "@/lib/queries/admin";
import AdminSellerQueueView from "@/components/admin/AdminSellerQueueView";

export const metadata = {
  title: "Admin Verifikasi Seller",
  description: "Ringkasan platform dan antrean verifikasi Mitra Nelayan.",
};

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireRolePage(["admin"]);
  const [stats, sellers] = await Promise.all([
    getAdminOverviewStats(),
    getAdminSellerQueue(),
  ]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
            Dashboard Admin & Verifikasi Seller
          </h1>
          <p className="text-[16px] text-[#475569]">
            Tinjau pendaftaran Mitra Nelayan baru serta pantau ringkasan akun dan
            produk aktif platform.
          </p>
        </div>

        <Link
          href="/admin/account"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:border-[#0369A1] hover:text-[#0369A1] self-start sm:self-auto"
        >
          Keamanan Akun & Sandi
        </Link>
      </div>

      <section aria-label="Ringkasan angka platform">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
          <div className="p-6 space-y-1">
            <p className="text-[14px] font-medium text-[#475569]">
              Total Pengguna Terdaftar
            </p>
            <p className="text-[28px] font-bold text-[#0F172A] tabular-nums">
              {stats.totalUsers}
            </p>
            <p className="text-[14px] text-[#64748B]">
              Admin, mitra nelayan, dan pembeli
            </p>
          </div>

          <div className="p-6 space-y-1">
            <p className="text-[14px] font-medium text-[#475569]">
              Seller Menunggu Verifikasi
            </p>
            <p className="text-[28px] font-bold text-[#B45309] tabular-nums">
              {stats.pendingSellers}
            </p>
            <p className="text-[14px] text-[#64748B]">
              Perlu persetujuan atau penolakan Admin
            </p>
          </div>

          <div className="p-6 space-y-1">
            <p className="text-[14px] font-medium text-[#475569]">
              Produk Aktif Tayang
            </p>
            <p className="text-[28px] font-bold text-[#0284C7] tabular-nums">
              {stats.activeProducts}
            </p>
            <p className="text-[14px] text-[#64748B] tabular-nums">
              Dari {stats.totalCategories} kategori hasil laut
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="seller-queue-heading" className="space-y-5">
        <h2
          id="seller-queue-heading"
          className="text-[22px] font-semibold text-[#0F172A]"
        >
          Antrean Verifikasi Mitra Nelayan
        </h2>
        <AdminSellerQueueView initialSellers={sellers} />
      </section>
    </div>
  );
}
