"use client";

import { useId, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { PAYMENT_METHOD_LABELS, formatRupiah } from "@/lib/format";

/**
 * Compact order card collapsed by default with key summary info and toggleable full details.
 */
export default function CollapsibleOrderCard({
  order,
  subtitle,
  summaryNote = null,
  addressTitle = "Alamat Pengiriman",
  actions = null,
  expanded,
  onExpandedChange,
  children,
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const detailsId = useId();

  const isControlled = typeof expanded === "boolean";
  const isExpanded = isControlled ? expanded : internalExpanded;

  function handleToggle() {
    const next = !isExpanded;
    if (!isControlled) {
      setInternalExpanded(next);
    }
    onExpandedChange?.(next);
  }

  return (
    <article className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[18px] font-semibold text-[#0F172A] tabular-nums">
              {order.order_code}
            </h2>
            <StatusBadge status={order.status} />
          </div>

          {subtitle}

          {summaryNote}
        </div>

        <div className="sm:text-right shrink-0">
          <p className="text-[14px] text-[#475569]">
            {PAYMENT_METHOD_LABELS[order.payment_method] ||
              order.payment_method}
          </p>
          <p className="text-[20px] font-bold text-[#0284C7] tabular-nums">
            {formatRupiah(order.total_amount)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          className="inline-flex min-h-[44px] items-center bg-transparent p-0 text-[14px] font-semibold text-[#0369A1] hover:text-[#075985] hover:underline transition-colors whitespace-nowrap"
        >
          {isExpanded ? "Sembunyikan" : "Lihat Detail"}
        </button>

        {actions ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {actions}
          </div>
        ) : null}
      </div>

      {isExpanded ? (
        <div
          id={detailsId}
          className="border-t border-[#E2E8F0] pt-4 space-y-4"
        >
          <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#334155] space-y-1">
            <p className="font-semibold text-[#0F172A]">{addressTitle}</p>
            <p className="whitespace-pre-line break-words">
              {order.shipping_address_snapshot}
            </p>
          </div>

          {children}
        </div>
      ) : null}
    </article>
  );
}
