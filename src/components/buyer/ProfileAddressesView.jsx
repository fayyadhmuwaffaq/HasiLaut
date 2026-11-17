"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";

const EMPTY_ADDRESS_FORM = {
  label: "",
  recipient_name: "",
  recipient_phone: "",
  full_address: "",
  city: "",
  postal_code: "",
  is_default: false,
};

export default function ProfileAddressesView({
  initialProfile,
  initialAddresses,
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState(
    initialProfile.phone_number || ""
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  const [addresses, setAddresses] = useState(initialAddresses);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDRESS_FORM);
  const [addrErrors, setAddrErrors] = useState({});
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrFeedback, setAddrFeedback] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingAddr, setDeletingAddr] = useState(false);

  async function handleSaveProfile(event) {
    event.preventDefault();
    setProfileFeedback(null);
    setSavingProfile(true);

    try {
      const response = await fetch("/api/buyer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setProfileFeedback({
          type: "error",
          message: data?.error || "Gagal menyimpan profil.",
        });
        setSavingProfile(false);
        return;
      }

      setProfileFeedback({
        type: "success",
        message: data?.message || "Profil berhasil diperbarui.",
      });
      setSavingProfile(false);
      router.refresh();
    } catch {
      setProfileFeedback({
        type: "error",
        message: "Terjadi kendala jaringan saat memperbarui profil.",
      });
      setSavingProfile(false);
    }
  }

  function openAddAddressForm() {
    setEditingId(null);
    setAddrForm({
      ...EMPTY_ADDRESS_FORM,
      recipient_name: fullName,
      recipient_phone: phoneNumber,
      is_default: addresses.length === 0,
    });
    setAddrErrors({});
    setAddrFeedback(null);
    setFormOpen(true);
  }

  function openEditAddressForm(addr) {
    setEditingId(addr.id);
    setAddrForm({
      label: addr.label || "",
      recipient_name: addr.recipient_name || "",
      recipient_phone: addr.recipient_phone || "",
      full_address: addr.full_address || "",
      city: addr.city || "",
      postal_code: addr.postal_code || "",
      is_default: Boolean(addr.is_default),
    });
    setAddrErrors({});
    setAddrFeedback(null);
    setFormOpen(true);
  }

  async function handleSaveAddress(event) {
    event.preventDefault();
    setAddrErrors({});
    setAddrFeedback(null);
    setSavingAddr(true);

    const url = editingId
      ? `/api/buyer/addresses/${editingId}`
      : "/api/buyer/addresses";
    const method = editingId ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addrForm),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.fieldErrors) {
          setAddrErrors(data.fieldErrors);
        }
        setAddrFeedback({
          type: "error",
          message: data?.error || "Gagal menyimpan alamat.",
        });
        setSavingAddr(false);
        return;
      }

      const listRes = await fetch("/api/buyer/addresses");
      const listData = listRes.ok ? await listRes.json() : null;
      if (listData?.addresses) {
        setAddresses(listData.addresses);
      }

      setFormOpen(false);
      setEditingId(null);
      setSavingAddr(false);
      setAddrFeedback({
        type: "success",
        message: data?.message || "Alamat berhasil disimpan.",
      });
      router.refresh();
    } catch {
      setAddrFeedback({
        type: "error",
        message: "Terjadi kendala jaringan saat menyimpan alamat.",
      });
      setSavingAddr(false);
    }
  }

  async function handleSetDefault(addressId) {
    setAddrFeedback(null);

    try {
      const response = await fetch(`/api/buyer/addresses/${addressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setAddrFeedback({
          type: "error",
          message: data?.error || "Gagal mengubah alamat utama.",
        });
        return;
      }

      setAddresses((prev) =>
        prev
          .map((addr) => ({ ...addr, is_default: addr.id === addressId }))
          .sort((a, b) => Number(b.is_default) - Number(a.is_default))
      );
      setAddrFeedback({
        type: "success",
        message: "Alamat utama berhasil diperbarui.",
      });
      router.refresh();
    } catch {
      setAddrFeedback({
        type: "error",
        message: "Terjadi kendala jaringan saat memperbarui alamat utama.",
      });
    }
  }

  async function handleDeleteAddress() {
    if (!deleteTarget) {
      return;
    }

    setDeletingAddr(true);
    setAddrFeedback(null);

    try {
      const response = await fetch(`/api/buyer/addresses/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setAddrFeedback({
          type: "error",
          message: data?.error || "Gagal menghapus alamat.",
        });
        setDeletingAddr(false);
        setDeleteTarget(null);
        return;
      }

      const listRes = await fetch("/api/buyer/addresses");
      const listData = listRes.ok ? await listRes.json() : null;
      if (listData?.addresses) {
        setAddresses(listData.addresses);
      } else {
        setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      }

      setDeletingAddr(false);
      setDeleteTarget(null);
      setAddrFeedback({
        type: "success",
        message: data?.message || "Alamat berhasil dihapus.",
      });
      router.refresh();
    } catch {
      setAddrFeedback({
        type: "error",
        message: "Terjadi kendala jaringan saat menghapus alamat.",
      });
      setDeletingAddr(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-12">
      <section className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 max-w-[680px]">
        <h2 className="text-[20px] font-semibold text-[#0F172A]">
          Informasi Akun Pembeli
        </h2>

        {profileFeedback ? (
          <div className="mt-4">
            {profileFeedback.type === "error" ? (
              <ErrorBanner message={profileFeedback.message} />
            ) : (
              <p
                role="status"
                aria-live="polite"
                className="rounded-md border border-[#047857]/30 bg-[#ECFDF5] px-4 py-3 text-[15px] font-medium text-[#047857]"
              >
                {profileFeedback.message}
              </p>
            )}
          </div>
        ) : null}

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="profile-email"
              className="block mb-2 text-[14px] font-medium text-[#475569]"
            >
              Email Akun
            </label>
            <input
              id="profile-email"
              type="email"
              value={initialProfile.email}
              disabled
              className="h-[44px] w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-[16px] text-[#475569]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="profile-full-name"
                className="block mb-2 text-[14px] font-medium text-[#475569]"
              >
                Nama Lengkap
              </label>
              <input
                id="profile-full-name"
                type="text"
                required
                maxLength={100}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label
                htmlFor="profile-phone"
                className="block mb-2 text-[14px] font-medium text-[#475569]"
              >
                Nomor Telepon
              </label>
              <input
                id="profile-phone"
                type="tel"
                maxLength={20}
                placeholder="08xxxxxxxxxx"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
            >
              {savingProfile ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        </form>
      </section>

      <section className="border-t border-[#E2E8F0] pt-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold text-[#0F172A]">
              Daftar Alamat Pengiriman
            </h2>
            <p className="mt-1 text-[15px] text-[#475569]">
              Simpan alamat rumah, dapur restoran, atau cabang usaha Anda.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddAddressForm}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] self-start sm:self-auto"
          >
            Tambah Alamat Baru
          </button>
        </div>

        {addrFeedback ? (
          addrFeedback.type === "error" ? (
            <ErrorBanner message={addrFeedback.message} />
          ) : (
            <p
              role="status"
              aria-live="polite"
              className="rounded-md border border-[#047857]/30 bg-[#ECFDF5] px-4 py-3 text-[15px] font-medium text-[#047857]"
            >
              {addrFeedback.message}
            </p>
          )
        ) : null}

        {formOpen ? (
          <form
            onSubmit={handleSaveAddress}
            noValidate
            className="rounded-lg border border-[#0369A1]/40 bg-[#FFFFFF] p-6 space-y-4 max-w-[740px]"
          >
            <h3 className="text-[18px] font-semibold text-[#0F172A]">
              {editingId ? "Ubah Alamat Pengiriman" : "Tambah Alamat Pengiriman"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="addr-label"
                  className="block mb-2 text-[14px] font-medium text-[#475569]"
                >
                  Label Alamat
                </label>
                <input
                  id="addr-label"
                  type="text"
                  maxLength={50}
                  placeholder="Contoh: Rumah, Dapur Resto"
                  value={addrForm.label}
                  onChange={(e) =>
                    setAddrForm((prev) => ({ ...prev, label: e.target.value }))
                  }
                  aria-invalid={Boolean(addrErrors.label)}
                  className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A]"
                />
                {addrErrors.label ? (
                  <p className="mt-1 text-[14px] text-[#B91C1C]">
                    {addrErrors.label}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="addr-recipient-name"
                  className="block mb-2 text-[14px] font-medium text-[#475569]"
                >
                  Nama Penerima
                </label>
                <input
                  id="addr-recipient-name"
                  type="text"
                  maxLength={100}
                  placeholder="Nama penerima paket"
                  value={addrForm.recipient_name}
                  onChange={(e) =>
                    setAddrForm((prev) => ({
                      ...prev,
                      recipient_name: e.target.value,
                    }))
                  }
                  aria-invalid={Boolean(addrErrors.recipient_name)}
                  className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A]"
                />
                {addrErrors.recipient_name ? (
                  <p className="mt-1 text-[14px] text-[#B91C1C]">
                    {addrErrors.recipient_name}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="addr-recipient-phone"
                  className="block mb-2 text-[14px] font-medium text-[#475569]"
                >
                  Nomor Telepon Penerima
                </label>
                <input
                  id="addr-recipient-phone"
                  type="tel"
                  maxLength={20}
                  placeholder="08xxxxxxxxxx"
                  value={addrForm.recipient_phone}
                  onChange={(e) =>
                    setAddrForm((prev) => ({
                      ...prev,
                      recipient_phone: e.target.value,
                    }))
                  }
                  aria-invalid={Boolean(addrErrors.recipient_phone)}
                  className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A]"
                />
                {addrErrors.recipient_phone ? (
                  <p className="mt-1 text-[14px] text-[#B91C1C]">
                    {addrErrors.recipient_phone}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="addr-city"
                    className="block mb-2 text-[14px] font-medium text-[#475569]"
                  >
                    Kota / Kabupaten
                  </label>
                  <input
                    id="addr-city"
                    type="text"
                    maxLength={100}
                    placeholder="Contoh: Makassar"
                    value={addrForm.city}
                    onChange={(e) =>
                      setAddrForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    aria-invalid={Boolean(addrErrors.city)}
                    className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[16px] text-[#0F172A]"
                  />
                  {addrErrors.city ? (
                    <p className="mt-1 text-[14px] text-[#B91C1C]">
                      {addrErrors.city}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="addr-postal"
                    className="block mb-2 text-[14px] font-medium text-[#475569]"
                  >
                    Kode Pos
                  </label>
                  <input
                    id="addr-postal"
                    type="text"
                    maxLength={10}
                    placeholder="Opsional"
                    value={addrForm.postal_code}
                    onChange={(e) =>
                      setAddrForm((prev) => ({
                        ...prev,
                        postal_code: e.target.value,
                      }))
                    }
                    className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[16px] text-[#0F172A]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="addr-full"
                className="block mb-2 text-[14px] font-medium text-[#475569]"
              >
                Alamat Lengkap
              </label>
              <textarea
                id="addr-full"
                rows={3}
                placeholder="Nama jalan, nomor bangunan, RT/RW, patokan..."
                value={addrForm.full_address}
                onChange={(e) =>
                  setAddrForm((prev) => ({
                    ...prev,
                    full_address: e.target.value,
                  }))
                }
                aria-invalid={Boolean(addrErrors.full_address)}
                className="w-full rounded-md border border-[#64748B] bg-[#FFFFFF] p-3 text-[16px] text-[#0F172A]"
              />
              {addrErrors.full_address ? (
                <p className="mt-1 text-[14px] text-[#B91C1C]">
                  {addrErrors.full_address}
                </p>
              ) : null}
            </div>

            <label className="inline-flex min-h-[44px] items-center gap-2.5 text-[15px] text-[#0F172A]">
              <input
                type="checkbox"
                checked={addrForm.is_default}
                onChange={(e) =>
                  setAddrForm((prev) => ({
                    ...prev,
                    is_default: e.target.checked,
                  }))
                }
                className="h-4 w-4 accent-[#0369A1]"
              />
              <span>Jadikan alamat utama</span>
            </label>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={savingAddr}
                className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
              >
                {savingAddr ? "Menyimpan..." : "Simpan Alamat"}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                Batal
              </button>
            </div>
          </form>
        ) : null}

        {addresses.length === 0 ? (
          <EmptyState
            title="Belum ada alamat pengiriman"
            description="Tambahkan minimal satu alamat pengiriman agar dapat melanjutkan proses checkout dari keranjang."
            actionLabel="Tambah Alamat Pertama"
            onAction={openAddAddressForm}
          />
        ) : (
          <ul className="divide-y divide-[#E2E8F0] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
            {addresses.map((addr) => (
              <li
                key={addr.id}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[17px] font-semibold text-[#0F172A]">
                      {addr.label}
                    </span>
                    {addr.is_default ? (
                      <span className="rounded-md bg-[#ECFDF5] px-2.5 py-0.5 text-[13px] font-semibold text-[#047857]">
                        Alamat Utama
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[15px] font-medium text-[#334155]">
                    {addr.recipient_name} · {addr.recipient_phone}
                  </p>
                  <p className="text-[15px] text-[#475569]">
                    {addr.full_address}, {addr.city}
                    {addr.postal_code ? ` ${addr.postal_code}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {!addr.is_default ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#0369A1] bg-[#FFFFFF] px-3.5 py-2 text-[14px] font-semibold text-[#0369A1] hover:bg-[#F0F9FF]"
                    >
                      Jadikan Alamat Utama
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openEditAddressForm(addr)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 py-2 text-[14px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(addr)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-3.5 py-2 text-[14px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2]"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Alamat Pengiriman"
        description={`Alamat "${deleteTarget?.label || ""}" akan dihapus dari daftar alamat Anda.`}
        confirmLabel="Ya, Hapus Alamat"
        cancelLabel="Batal"
        destructive
        loading={deletingAddr}
        onConfirm={handleDeleteAddress}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
