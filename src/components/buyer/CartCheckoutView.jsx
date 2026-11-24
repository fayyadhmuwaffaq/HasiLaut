"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { useToast } from "@/components/ui/ToastProvider";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import { formatKg, formatRupiah } from "@/lib/format";

export default function CartCheckoutView({ initialCart, addresses }) {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [items, setItems] = useState(initialCart.items);
  const defaultAddress =
    addresses.find((addr) => addr.is_default) || addresses[0] || null;
  const [selectedAddressId, setSelectedAddressId] = useState(
    defaultAddress ? defaultAddress.id : ""
  );
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [busyItemId, setBusyItemId] = useState(null);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const totalAmount =
    Math.round(items.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100;

  const storeGroups = [];
  const storeMap = new Map();
  for (const item of items) {
    let group = storeMap.get(item.store_id);
    if (!group) {
      group = {
        storeId: item.store_id,
        storeName: item.store_name,
        dockLocation: item.dock_location,
        items: [],
      };
      storeMap.set(item.store_id, group);
      storeGroups.push(group);
    }
    group.items.push(item);
  }

  const hasUnavailableItems = items.some((item) => !item.is_available);

  async function handleQuantityChange(itemId, nextKg) {
    setErrorMessage("");
    setBusyItemId(itemId);

    try {
      const response = await fetch(`/api/buyer/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantityKg: nextKg }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal memperbarui jumlah item.");
        setBusyItemId(null);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) {
            return item;
          }
          const updatedQty = data.item.quantity_kg;
          return {
            ...item,
            quantity_kg: updatedQty,
            subtotal: data.item.subtotal,
            is_available:
              item.seller_status === "approved" &&
              item.is_active !== false &&
              item.stock_kg >= updatedQty,
          };
        })
      );
      setBusyItemId(null);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat memperbarui keranjang.");
      setBusyItemId(null);
    }
  }

  async function handleRemoveItem(itemId, productName) {
    setErrorMessage("");
    setBusyItemId(itemId);

    try {
      const response = await fetch(`/api/buyer/cart/${itemId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal menghapus item dari keranjang.");
        setBusyItemId(null);
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      showSuccess(`${productName} dihapus dari keranjang.`);
      setBusyItemId(null);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat menghapus item.");
      setBusyItemId(null);
    }
  }

  async function handleCheckout(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!selectedAddressId) {
      setErrorMessage("Pilih atau tambahkan alamat pengiriman terlebih dahulu.");
      return;
    }

    setSubmittingCheckout(true);

    try {
      const response = await fetch("/api/buyer/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: Number(selectedAddressId),
          paymentMethod,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal memproses checkout.");
        setSubmittingCheckout(false);
        return;
      }

      const orderCount = Array.isArray(data?.orders) ? data.orders.length : 1;
      router.push(`/buyer/orders?checkout=1&count=${orderCount}`);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat memproses checkout.");
      setSubmittingCheckout(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Keranjang belanja masih kosong"
        description="Pilih produk hasil laut segar minimal 0,5 kg dari katalog untuk memulai pesanan."
        actionLabel="Jelajahi Katalog"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {storeGroups.length > 1 ? (
        <div
          role="status"
          className="rounded-md border border-[#0369A1]/30 bg-[#F0F9FF] px-4 py-3 text-[15px] text-[#0369A1]"
        >
          Keranjang berisi produk dari {storeGroups.length} lapak berbeda. Saat
          checkout, sistem otomatis memisahkan transaksi menjadi{" "}
          {storeGroups.length} pesanan terpisah per lapak.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {storeGroups.map((group) => (
            <section
              key={group.storeId}
              className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] overflow-hidden"
            >
              <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3.5">
                <h2 className="text-[17px] font-semibold text-[#0F172A]">
                  <Link
                    href={`/stores/${group.storeId}`}
                    className="inline-flex min-h-[44px] items-center hover:text-[#0369A1] hover:underline"
                  >
                    {group.storeName}
                  </Link>
                </h2>
                {group.dockLocation ? (
                  <p className="text-[14px] text-[#475569]">
                    {group.dockLocation}
                  </p>
                ) : null}
              </div>

              <ul className="divide-y divide-[#E2E8F0]">
                {group.items.map((item) => {
                  const isBusy = busyItemId === item.id;
                  return (
                    <li
                      key={item.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center gap-5"
                    >
                      <Link
                        href={`/products/${item.product_id}`}
                        className="h-24 w-32 shrink-0 rounded-md border border-[#E2E8F0] bg-[#F1F5F9] overflow-hidden"
                      >
                        <Image
                          src={
                            item.image_url ||
                            "/placeholders/seafood-placeholder.svg"
                          }
                          alt={item.product_name}
                          width={160}
                          height={120}
                          className="h-full w-full object-cover"
                        />
                      </Link>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <Link
                            href={`/products/${item.product_id}`}
                            className="text-[17px] font-semibold text-[#0F172A] hover:text-[#0369A1]"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-[17px] font-bold text-[#0284C7] tabular-nums">
                            {formatRupiah(item.subtotal)}
                          </p>
                        </div>

                        <p className="text-[14px] text-[#475569] tabular-nums">
                          {formatRupiah(item.price_per_kg)} / kg · Sisa stok{" "}
                          {formatKg(item.stock_kg)}
                        </p>

                        {!item.is_available ? (
                          <p className="text-[14px] font-medium text-[#B91C1C]">
                            {item.is_active === false
                              ? "Produk sedang dinonaktifkan oleh penjual. Hapus item untuk melanjutkan checkout."
                              : "Jumlah melebihi sisa stok atau lapak sedang tidak aktif. Sesuaikan berat atau hapus item."}
                          </p>
                        ) : null}

                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                          <QuantityStepper
                            id={`cart-qty-${item.id}`}
                            value={item.quantity_kg}
                            onChange={(val) =>
                              handleQuantityChange(item.id, val)
                            }
                            min={0.5}
                            max={Math.max(0.5, item.stock_kg)}
                            step={0.5}
                            disabled={
                              isBusy ||
                              item.stock_kg < 0.5 ||
                              item.is_active === false
                            }
                            label={`Jumlah ${item.product_name} (Kg)`}
                            hideLabel
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveItem(item.id, item.product_name)
                            }
                            disabled={isBusy}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-4 py-2 text-[14px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-50"
                          >
                            {isBusy ? "Memproses..." : "Hapus"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-[92px] lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 sm:p-6">
          <h2 className="text-[20px] font-semibold text-[#0F172A]">
            Ringkasan Checkout
          </h2>

          <form onSubmit={handleCheckout} className="mt-5 space-y-6">
            <fieldset className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <legend className="text-[14px] font-medium text-[#475569]">
                  Alamat Pengiriman
                </legend>
                <Link
                  href="/buyer/profile"
                  className="text-[14px] font-semibold text-[#0369A1] hover:underline py-1"
                >
                  Kelola Alamat
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
                  <p className="text-[14px] text-[#475569]">
                    Anda belum memiliki alamat pengiriman tersimpan.
                  </p>
                  <Link
                    href="/buyer/profile"
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md border border-[#0369A1] bg-[#FFFFFF] px-4 py-2 text-[15px] font-semibold text-[#0369A1] hover:bg-[#F0F9FF]"
                  >
                    Tambah Alamat Pengiriman
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {addresses.map((addr) => {
                    const checked = Number(selectedAddressId) === addr.id;
                    return (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 rounded-md border p-3.5 transition-colors ${
                          checked
                            ? "border-[#0369A1] bg-[#F0F9FF]"
                            : "border-[#64748B] bg-[#FFFFFF] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="addressId"
                          value={addr.id}
                          checked={checked}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 h-4 w-4 accent-[#0369A1]"
                        />
                        <span className="text-[14px] text-[#334155] min-w-0">
                          <span className="block font-semibold text-[#0F172A]">
                            {addr.label} ({addr.recipient_name})
                          </span>
                          <span className="block mt-0.5">
                            {addr.recipient_phone}
                          </span>
                          <span className="block mt-0.5">
                            {addr.full_address}, {addr.city}
                            {addr.postal_code ? ` ${addr.postal_code}` : ""}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <fieldset className="space-y-3 border-t border-[#E2E8F0] pt-5">
              <legend className="text-[14px] font-medium text-[#475569]">
                Metode Pembayaran
              </legend>

              <div className="space-y-2.5">
                <label
                  className={`flex items-start gap-3 rounded-md border p-3.5 transition-colors ${
                    paymentMethod === "cod"
                      ? "border-[#0369A1] bg-[#F0F9FF]"
                      : "border-[#64748B] bg-[#FFFFFF] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1 h-4 w-4 accent-[#0369A1]"
                  />
                  <span className="text-[14px] text-[#334155]">
                    <span className="block font-semibold text-[#0F172A]">
                      Bayar di Tempat (COD)
                    </span>
                    <span className="block mt-0.5">
                      Bayar langsung saat pesanan hasil laut tiba di alamat Anda.
                    </span>
                  </span>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-md border p-3.5 transition-colors ${
                    paymentMethod === "bank_transfer"
                      ? "border-[#0369A1] bg-[#F0F9FF]"
                      : "border-[#64748B] bg-[#FFFFFF] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={() => setPaymentMethod("bank_transfer")}
                    className="mt-1 h-4 w-4 accent-[#0369A1]"
                  />
                  <span className="text-[14px] text-[#334155]">
                    <span className="block font-semibold text-[#0F172A]">
                      Transfer Bank Manual
                    </span>
                    <span className="block mt-0.5">
                      Lakukan transfer manual dengan mencantumkan kode pesanan.
                    </span>
                  </span>
                </label>
              </div>

              {paymentMethod === "bank_transfer" ? (
                <div className="rounded-md border border-[#B45309]/30 bg-[#FFFBEB] p-3.5 text-[14px] text-[#B45309]">
                  Setelah checkout, kode pesanan dan nominal tagihan per lapak
                  akan tampil di halaman Riwayat Pesanan untuk panduan transfer
                  manual.
                </div>
              ) : null}
            </fieldset>

            <div className="border-t border-[#E2E8F0] pt-5 space-y-2">
              <div className="flex items-baseline justify-between text-[14px] text-[#475569]">
                <span>Jumlah pesanan diterbitkan</span>
                <span className="font-semibold text-[#0F172A] tabular-nums">
                  {storeGroups.length} pesanan
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[16px] font-semibold text-[#0F172A]">
                  Total Pembayaran
                </span>
                <span className="text-[22px] font-bold text-[#0284C7] tabular-nums">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                submittingCheckout ||
                addresses.length === 0 ||
                !selectedAddressId ||
                hasUnavailableItems
              }
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50 transition-colors"
            >
              {submittingCheckout ? "Memproses Pesanan..." : "Buat Pesanan"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
