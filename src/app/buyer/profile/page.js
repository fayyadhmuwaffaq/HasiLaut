import { requireRolePage } from "@/lib/auth-guards";
import { getBuyerAddresses } from "@/lib/queries/buyer";
import ProfileAddressesView from "@/components/buyer/ProfileAddressesView";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

export const metadata = {
  title: "Profil & Alamat Pengiriman",
  description:
    "Kelola informasi akun Pembeli, keamanan kata sandi, dan daftar alamat pengiriman.",
};

export const dynamic = "force-dynamic";

export default async function BuyerProfilePage() {
  const user = await requireRolePage(["buyer"]);
  const addresses = await getBuyerAddresses(user.id);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
      <div className="space-y-2">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Profil & Alamat Pengiriman
        </h1>
        <p className="text-[16px] text-[#475569]">
          Perbarui nama, email masuk, nomor telepon, alamat tujuan pengiriman,
          dan kata sandi akun Anda.
        </p>
      </div>

      <ProfileAddressesView
        initialProfile={{
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number || "",
        }}
        initialAddresses={addresses}
        securitySection={
          <section
            aria-labelledby="buyer-password-heading"
            className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-5"
          >
            <div className="space-y-1">
              <h2
                id="buyer-password-heading"
                className="text-[20px] font-semibold text-[#0F172A]"
              >
                Keamanan Akun & Kata Sandi
              </h2>
              <p className="text-[15px] text-[#475569]">
                Ganti kata sandi akun Pembeli Anda kapan saja. Sesi aktif tetap
                berjalan setelah perubahan disimpan.
              </p>
            </div>

            <ChangePasswordForm idPrefix="buyer-pw" />
          </section>
        }
      />
    </div>
  );
}
