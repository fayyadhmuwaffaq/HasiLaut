import { requireRolePage } from "@/lib/auth-guards";
import { getBuyerAddresses, getBuyerCartData } from "@/lib/queries/buyer";
import CartCheckoutView from "@/components/buyer/CartCheckoutView";

export const metadata = {
  title: "Keranjang & Checkout",
  description: "Kelola jumlah kilogram belanja dan selesaikan pesanan.",
};

export const dynamic = "force-dynamic";

export default async function BuyerCartPage() {
  const user = await requireRolePage(["buyer"]);
  const [cart, addresses] = await Promise.all([
    getBuyerCartData(user.id),
    getBuyerAddresses(user.id),
  ]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="space-y-2">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Keranjang Belanja
        </h1>
        <p className="text-[16px] text-[#475569]">
          Periksa berat pembelian dalam kilogram, pilih alamat tujuan, lalu
          lanjutkan pemesanan.
        </p>
      </div>

      <CartCheckoutView initialCart={cart} addresses={addresses} />
    </div>
  );
}
