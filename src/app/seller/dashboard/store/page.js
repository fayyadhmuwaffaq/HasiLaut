import { requireApprovedSellerPage } from "@/lib/auth-guards";
import SessionSyncRedirect from "@/components/auth/SessionSyncRedirect";
import SellerStoreForm from "@/components/seller/SellerStoreForm";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { ErrorBanner } from "@/components/ui/FeedbackStates";

export const metadata = {
  title: "Profil Lapak & Akun Seller",
  description:
    "Kelola nama lapak, lokasi dermaga TPI, foto toko, serta keamanan kata sandi akun Mitra Nelayan.",
};

export const dynamic = "force-dynamic";

export default async function SellerStorePage() {
  const { store, needsSessionSync, syncTarget } =
    await requireApprovedSellerPage();

  if (needsSessionSync && syncTarget) {
    return <SessionSyncRedirect target={syncTarget} />;
  }

  if (!store) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorBanner message="Profil lapak belum ditemukan." />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      <div className="space-y-1">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Profil Lapak Nelayan
        </h1>
        <p className="text-[16px] text-[#475569]">
          Informasi ini tampil kepada pembeli pada halaman detail produk dan
          daftar pesanan.
        </p>
      </div>

      <SellerStoreForm initialStore={store} />

      <section
        aria-labelledby="seller-password-heading"
        className="border-t border-[#E2E8F0] pt-10"
      >
        <div className="max-w-[680px] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h2
              id="seller-password-heading"
              className="text-[20px] font-semibold text-[#0F172A]"
            >
              Keamanan Akun & Kata Sandi
            </h2>
            <p className="text-[15px] text-[#475569]">
              Ubah kata sandi akun Mitra Nelayan Anda. Sesi aktif tetap berjalan
              setelah pembaruan disimpan.
            </p>
          </div>

          <ChangePasswordForm idPrefix="seller-pw" />
        </div>
      </section>
    </div>
  );
}
