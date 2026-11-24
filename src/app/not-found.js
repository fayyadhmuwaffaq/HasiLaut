import Link from "next/link";

export const metadata = {
  title: "Halaman Tidak Ditemukan",
};

export default function NotFoundPage() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 py-16">
      <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-4">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A]">
          Halaman Tidak Ditemukan
        </h1>
        <p className="max-w-[65ch] text-[16px] text-[#475569]">
          Halaman atau produk yang Anda cari tidak tersedia atau telah dihapus.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] transition-colors"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/products"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-5 py-2.5 text-[16px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          >
            Buka Katalog
          </Link>
        </div>
      </div>
    </section>
  );
}
