import Link from "next/link";
import { requireRolePage } from "@/lib/auth-guards";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

export const metadata = {
  title: "Keamanan Akun Admin",
  description: "Kelola keamanan akun Administrator dan ubah kata sandi.",
};

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const adminUser = await requireRolePage(["admin"]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
            Keamanan Akun Admin
          </h1>
          <p className="text-[16px] text-[#475569]">
            Perbarui kata sandi akun Administrator secara berkala untuk menjaga
            keamanan platform.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] self-start sm:self-auto"
        >
          Kembali ke Ringkasan Admin
        </Link>
      </div>

      <section
        aria-label="Informasi akun Administrator"
        className="max-w-[680px] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-4"
      >
        <h2 className="text-[20px] font-semibold text-[#0F172A]">
          Identitas Akun
        </h2>
        <dl className="divide-y divide-[#E2E8F0] text-[15px]">
          <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1">
            <dt className="text-[#475569]">Nama Lengkap</dt>
            <dd className="font-medium text-[#0F172A]">{adminUser.full_name}</dd>
          </div>
          <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1">
            <dt className="text-[#475569]">Email</dt>
            <dd className="font-medium text-[#0F172A]">{adminUser.email}</dd>
          </div>
          <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1">
            <dt className="text-[#475569]">Peran</dt>
            <dd className="font-medium text-[#0F172A]">Administrator</dd>
          </div>
        </dl>
      </section>

      <section
        aria-labelledby="admin-password-heading"
        className="max-w-[680px] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-5"
      >
        <div className="space-y-1">
          <h2
            id="admin-password-heading"
            className="text-[20px] font-semibold text-[#0F172A]"
          >
            Ubah Kata Sandi
          </h2>
          <p className="text-[15px] text-[#475569]">
            Masukkan kata sandi saat ini terlebih dahulu sebelum menetapkan
            kata sandi baru.
          </p>
        </div>

        <ChangePasswordForm idPrefix="admin-pw" />
      </section>
    </div>
  );
}
