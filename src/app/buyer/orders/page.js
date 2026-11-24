import { requireRolePage } from "@/lib/auth-guards";
import { getBuyerOrdersWithItems } from "@/lib/queries/buyer";
import BuyerOrdersView from "@/components/buyer/BuyerOrdersView";

export const metadata = {
  title: "Riwayat Pesanan",
  description: "Pantau status pesanan hasil laut dan berikan ulasan produk.",
};

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage({ searchParams }) {
  const user = await requireRolePage(["buyer"]);
  const resolved = await searchParams;
  const checkoutSuccessCount =
    resolved?.checkout === "1"
      ? Math.max(1, Number.parseInt(resolved?.count || "1", 10) || 1)
      : 0;
  const initialTab =
    typeof resolved?.status === "string" ? resolved.status.trim() : "all";

  const orders = await getBuyerOrdersWithItems(user.id);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="space-y-2">
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#0F172A]">
          Riwayat Pesanan
        </h1>
        <p className="text-[16px] text-[#475569]">
          Lacak perkembangan pengiriman dari setiap lapak atau berikan ulasan
          setelah pesanan selesai.
        </p>
      </div>

      <BuyerOrdersView
        initialOrders={orders}
        checkoutSuccessCount={checkoutSuccessCount}
        initialTab={initialTab}
      />
    </div>
  );
}
