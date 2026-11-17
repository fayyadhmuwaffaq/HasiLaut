import { ORDER_STATUS_META, SELLER_STATUS_META } from "@/lib/format";

export default function StatusBadge({ status, variant = "order" }) {
  const map = variant === "seller" ? SELLER_STATUS_META : ORDER_STATUS_META;
  const meta = map[status] ?? {
    label: status || "Tidak Diketahui",
    badgeClass: "bg-[#F1F5F9] text-[#334155]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  );
}
