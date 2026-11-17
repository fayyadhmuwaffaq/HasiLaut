"use client";

import { useState } from "react";
import QuantityStepper from "@/components/ui/QuantityStepper";
import AddToCartButton from "@/components/AddToCartButton";
import { formatRupiah } from "@/lib/format";

export default function ProductPurchasePanel({
  productId,
  productName,
  pricePerKg,
  stockKg,
  isBuyer,
}) {
  const numericStock = Number(stockKg);
  const numericPrice = Number(pricePerKg);
  const isOutOfStock = !Number.isFinite(numericStock) || numericStock < 0.5;
  const initialQty = numericStock >= 1 ? 1 : 0.5;

  const [quantityKg, setQuantityKg] = useState(initialQty);
  const estimatedSubtotal = Math.round(quantityKg * numericPrice * 100) / 100;

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <QuantityStepper
          id="product-detail-qty"
          value={quantityKg}
          onChange={setQuantityKg}
          min={0.5}
          max={isOutOfStock ? 0.5 : numericStock}
          step={0.5}
          disabled={isOutOfStock}
          label="Jumlah pembelian (minimal 0,5 kg)"
        />

        <div className="sm:text-right">
          <p className="text-[14px] text-[#475569]">Perkiraan subtotal</p>
          <p className="text-[20px] font-bold text-[#0F172A] tabular-nums">
            {formatRupiah(estimatedSubtotal)}
          </p>
        </div>
      </div>

      <AddToCartButton
        productId={productId}
        productName={productName}
        stockKg={numericStock}
        isBuyer={isBuyer}
        quantityKg={quantityKg}
      />
    </div>
  );
}
