import Link from "next/link";
import { requireRolePage } from "@/lib/auth-guards";
import AccountIdentityForm from "@/components/auth/AccountIdentityForm";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

export const metadata = {
  title: "Profil & Keamanan Akun Admin",
  description:
    "Ubah nama, email, nomor telepon resmi, dan kata sandi keamanan akun Administrator.",
};

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const adminUser = await requireRolePage(["admin"]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
            Profil & Keamanan Akun Admin
          </h1>
          <p className="text-[16px] text-[#475569]">
            Perbarui nama, email, nomor telepon resmi (ditampilkan pada halaman
            banding seller), serta kata sandi akun Administrator.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] self-start sm:self-auto"
        >
          Kembali ke Ringkasan Admin
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <section
          aria-labelledby="admin-identity-heading"
          className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-1">
            <h2
              id="admin-identity-heading"
              className="text-[20px] font-semibold text-[#0F172A]"
            >
              Identitas Akun
            </h2>
            <p className="text-[15px] text-[#475569]">
              Ubah nama tampilan atau email masuk akun Administrator Anda.
            </p>
          </div>

          <AccountIdentityForm
            idPrefix="admin"
            endpoint="/api/admin/account"
            initialFullName={adminUser.full_name}
            initialEmail={adminUser.email}
            initialPhone={adminUser.phone_number || ""}
            showPhone
            roleLabel="Administrator"
          />
        </section>

        <section
          aria-labelledby="admin-password-heading"
          className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-5"
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
    </div>
  );
}
