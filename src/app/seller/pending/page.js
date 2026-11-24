import { getPendingSellerState } from "@/lib/auth-guards";
import StatusBadge from "@/components/ui/StatusBadge";
import SignOutButton from "@/components/ui/SignOutButton";
import DeleteRejectedAccountButton from "@/components/auth/DeleteRejectedAccountButton";
import SessionSyncRedirect from "@/components/auth/SessionSyncRedirect";

export const metadata = {
  title: "Status Verifikasi Seller",
  description: "Status peninjauan akun Mitra Nelayan HasiLaut.",
};

export const dynamic = "force-dynamic";

export default async function SellerPendingPage() {
  const { user, store, needsSessionSync, syncTarget } =
    await getPendingSellerState();

  if (needsSessionSync && syncTarget) {
    return <SessionSyncRedirect target={syncTarget} />;
  }

  const isRejected = user.seller_status === "rejected";

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-[680px] mx-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge variant="seller" status={user.seller_status} />
          <span className="text-[14px] text-[#64748B]">{user.email}</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A]">
            {isRejected
              ? "Pendaftaran Mitra Nelayan Ditolak"
              : "Akun Anda sedang ditinjau oleh Admin."}
          </h1>

          {isRejected ? (
            <p className="max-w-[65ch] text-[16px] text-[#334155]">
              Pengajuan lapak Anda belum dapat disetujui pada peninjauan saat ini.
              Anda dapat menghapus akun beserta data lapak yang terdaftar apabila
              ingin mendaftar ulang di lain waktu.
            </p>
          ) : (
            <p className="max-w-[65ch] text-[16px] text-[#334155]">
              Tim Admin sedang memeriksa informasi akun dan lapak Anda. Setelah
              status berubah menjadi Disetujui, Anda dapat mengelola produk dan
              pesanan masuk melalui Dashboard Seller.
            </p>
          )}
        </div>

        <div className="border-t border-[#E2E8F0] pt-5 space-y-3">
          <h2 className="text-[18px] font-semibold text-[#0F172A]">
            Ringkasan Data Mitra
          </h2>
          <dl className="divide-y divide-[#E2E8F0] text-[15px]">
            <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#475569]">Nama Pemilik</dt>
              <dd className="font-medium text-[#0F172A]">{user.full_name}</dd>
            </div>
            <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#475569]">Nama Lapak / Toko</dt>
              <dd className="font-medium text-[#0F172A]">
                {store?.store_name || "-"}
              </dd>
            </div>
            <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#475569]">Lokasi Dermaga / TPI</dt>
              <dd className="font-medium text-[#0F172A]">
                {store?.dock_location || "Belum diisi"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-[#E2E8F0] pt-5 flex flex-wrap items-center gap-3">
          {isRejected ? (
            <DeleteRejectedAccountButton storeName={store?.store_name} />
          ) : null}
          <SignOutButton />
        </div>
      </div>
    </section>
  );
}
