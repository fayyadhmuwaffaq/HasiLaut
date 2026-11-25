import { getPendingSellerState } from "@/lib/auth-guards";
import StatusBadge from "@/components/ui/StatusBadge";
import SignOutButton from "@/components/ui/SignOutButton";
import DeleteRejectedAccountButton from "@/components/auth/DeleteRejectedAccountButton";
import SessionSyncRedirect from "@/components/auth/SessionSyncRedirect";
import SellerAppealDetails from "@/components/seller/SellerAppealDetails";
import { formatDateTime } from "@/lib/format";

export const metadata = {
  title: "Status Verifikasi Seller",
  description: "Status peninjauan akun Mitra Nelayan HasiLaut.",
};

export const dynamic = "force-dynamic";

export default async function SellerPendingPage() {
  const {
    user,
    store,
    storeStats,
    adminContact,
    needsSessionSync,
    syncTarget,
  } = await getPendingSellerState();

  if (needsSessionSync && syncTarget) {
    return <SessionSyncRedirect target={syncTarget} />;
  }

  const isRejected = user.seller_status === "rejected";
  const hasTransactionHistory = (storeStats?.totalOrders ?? 0) > 0;
  const activeOrdersCount = storeStats?.activeOrders ?? 0;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-[700px] mx-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge variant="seller" status={user.seller_status} />
          <span className="text-[14px] text-[#64748B]">{user.email}</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#0F172A]">
            {isRejected
              ? hasTransactionHistory
                ? "Akun Mitra Dinonaktifkan oleh Admin"
                : "Pendaftaran Mitra Nelayan Ditolak"
              : "Akun Anda sedang ditinjau oleh Admin."}
          </h1>

          {isRejected ? (
            <p className="max-w-[65ch] text-[15px] text-[#334155]">
              {hasTransactionHistory
                ? "Akun lapak Anda saat ini berstatus Ditolak sehingga produk sementara disembunyikan dari katalog pembeli. Buka Lihat Detail untuk melihat kontak resmi Admin dalam pengajuan banding."
                : "Pengajuan lapak Anda belum dapat disetujui. Buka Lihat Detail untuk melihat kontak resmi Admin dalam pengajuan banding, atau hapus akun ini bila ingin mendaftar ulang."}
            </p>
          ) : (
            <p className="max-w-[65ch] text-[15px] text-[#334155]">
              Tim Admin sedang memeriksa informasi akun dan lapak Anda. Setelah
              status berubah menjadi Disetujui, Anda dapat langsung mengelola
              produk dan pesanan di Dashboard Seller.
            </p>
          )}
        </div>

        {isRejected ? (
          <div className="space-y-3">
            <div
              role="status"
              className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4 space-y-1"
            >
              <h2 className="text-[14px] font-semibold text-[#B91C1C]">
                Alasan Penolakan dari Admin
              </h2>
              <p className="text-[15px] leading-relaxed text-[#7F1D1D] whitespace-pre-line">
                {user.rejection_reason ||
                  "Admin belum mencantumkan catatan tambahan untuk penolakan ini."}
              </p>
            </div>

            {activeOrdersCount > 0 ? (
              <div
                role="status"
                className="rounded-lg border border-[#F59E0B] bg-[#FFFBEB] p-3.5 text-[14px] text-[#92400E]"
              >
                Terdapat <strong>{activeOrdersCount}</strong> pesanan berjalan
                di lapak Anda yang masih menunggu penyelesaian. Harap segera
                berkoordinasi dengan Admin saat mengajukan banding.
              </div>
            ) : null}

            <SellerAppealDetails adminContact={adminContact} />
          </div>
        ) : null}

        <div className="border-t border-[#E2E8F0] pt-5 space-y-2.5">
          <h2 className="text-[16px] font-semibold text-[#0F172A]">
            Ringkasan Data Mitra
          </h2>
          <dl className="divide-y divide-[#E2E8F0] text-[14px]">
            <div className="py-2 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#475569]">Nama Pemilik</dt>
              <dd className="font-medium text-[#0F172A]">{user.full_name}</dd>
            </div>
            <div className="py-2 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#475569]">Nama Lapak / Toko</dt>
              <dd className="font-medium text-[#0F172A]">
                {store?.store_name || "-"}
              </dd>
            </div>
            <div className="py-2 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#475569]">Lokasi Dermaga / TPI</dt>
              <dd className="font-medium text-[#0F172A]">
                {store?.dock_location || "Belum diisi"}
              </dd>
            </div>
            {isRejected && user.rejected_at ? (
              <div className="py-2 flex flex-col sm:flex-row sm:justify-between gap-1">
                <dt className="text-[#475569]">Status Diperbarui</dt>
                <dd className="font-medium text-[#0F172A]">
                  {formatDateTime(user.rejected_at)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {isRejected && !hasTransactionHistory ? (
              <DeleteRejectedAccountButton storeName={store?.store_name} />
            ) : null}
            <SignOutButton />
          </div>

          {isRejected && hasTransactionHistory ? (
            <p className="text-[13px] text-[#475569]">
              Akun ini telah memiliki riwayat transaksi sehingga tidak dapat
              dihapus mandiri. Buka Lihat Detail untuk menghubungi Admin dalam
              pengajuan banding.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
