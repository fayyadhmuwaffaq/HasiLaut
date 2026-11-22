"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import { CloseIcon } from "@/components/ui/Icons";
import { formatDateTime } from "@/lib/format";

const ROLE_TABS = [
  { id: "buyer", label: "Pembeli" },
  { id: "seller", label: "Penjual" },
];

export default function AdminUsersView({ initialUsers, currentAdminId }) {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [activeTab, setActiveTab] = useState("buyer");
  const [searchQuery, setSearchQuery] = useState("");
  const [sellerStatusFilter, setSellerStatusFilter] = useState("all");

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [editError, setEditError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const editTitleId = useId();
  const editNameRef = useRef(null);
  const tabRefs = useRef({ buyer: null, seller: null });

  const buyerUsers = useMemo(
    () => users.filter((u) => u.role === "buyer"),
    [users]
  );
  const sellerUsers = useMemo(
    () => users.filter((u) => u.role === "seller"),
    [users]
  );

  const sellerBreakdown = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    for (const s of sellerUsers) {
      if (s.seller_status === "approved") approved += 1;
      else if (s.seller_status === "pending") pending += 1;
      else if (s.seller_status === "rejected") rejected += 1;
    }
    return { approved, pending, rejected };
  }, [sellerUsers]);

  const filteredList = useMemo(() => {
    const baseList = activeTab === "buyer" ? buyerUsers : sellerUsers;
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return baseList.filter((item) => {
      if (
        activeTab === "seller" &&
        sellerStatusFilter !== "all" &&
        item.seller_status !== sellerStatusFilter
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        item.full_name,
        item.email,
        item.phone_number,
        item.store_name,
        item.dock_location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [activeTab, buyerUsers, sellerUsers, searchQuery, sellerStatusFilter]);

  useEffect(() => {
    if (!editTarget) {
      return undefined;
    }

    editNameRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !savingEdit) {
        setEditTarget(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editTarget, savingEdit]);

  function handleTabKeyDown(event, index) {
    let nextIndex = null;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % ROLE_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + ROLE_TABS.length) % ROLE_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = ROLE_TABS.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const targetTab = ROLE_TABS[nextIndex].id;
      setActiveTab(targetTab);
      tabRefs.current[targetTab]?.focus();
    }
  }

  function openEditModal(user) {
    setEditTarget(user);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
    });
    setEditError("");
    setErrorMessage("");
  }

  async function handleSaveEdit(event) {
    event.preventDefault();
    if (!editTarget) {
      return;
    }

    setEditError("");
    setErrorMessage("");
    setSavingEdit(true);

    try {
      const response = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setEditError(data?.error || "Gagal memperbarui data pengguna.");
        setSavingEdit(false);
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editTarget.id
            ? {
                ...u,
                full_name: data.user.full_name,
                email: data.user.email,
                phone_number: data.user.phone_number,
              }
            : u
        )
      );
      showSuccess(data?.message || "Data pengguna diperbarui.");
      setSavingEdit(false);
      setEditTarget(null);
      router.refresh();
    } catch {
      setEditError("Terjadi kendala jaringan saat memperbarui pengguna.");
      setSavingEdit(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal menghapus pengguna.");
        setDeleting(false);
        setDeleteTarget(null);
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      showSuccess(data?.message || "Pengguna dihapus.");
      setDeleting(false);
      setDeleteTarget(null);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat menghapus pengguna.");
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const activeTotalCount =
    activeTab === "buyer" ? buyerUsers.length : sellerUsers.length;
  const activeNoun = activeTab === "buyer" ? "pembeli" : "penjual";

  return (
    <div className="space-y-6">
      <section aria-label="Ringkasan jumlah pembeli dan penjual">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
          <div className="p-5 sm:p-6 space-y-1">
            <p className="text-[14px] font-medium text-[#475569]">
              Total Pembeli
            </p>
            <p className="text-[28px] font-bold text-[#0F172A] tabular-nums">
              {buyerUsers.length}
            </p>
            <p className="text-[14px] text-[#64748B]">
              Akun pembeli hasil laut terdaftar
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-1">
            <p className="text-[14px] font-medium text-[#475569]">
              Total Penjual
            </p>
            <p className="text-[28px] font-bold text-[#0284C7] tabular-nums">
              {sellerUsers.length}
            </p>
            <p className="text-[14px] text-[#64748B] tabular-nums">
              {sellerBreakdown.approved} disetujui · {sellerBreakdown.pending}{" "}
              menunggu · {sellerBreakdown.rejected} ditolak
            </p>
          </div>
        </div>
      </section>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <div
        role="tablist"
        aria-label="Pilih tipe pengguna"
        className="flex flex-wrap border-b border-[#E2E8F0] gap-2"
      >
        {ROLE_TABS.map((tab, index) => {
          const isSelected = activeTab === tab.id;
          const tabCount =
            tab.id === "buyer" ? buyerUsers.length : sellerUsers.length;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              id={`users-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`users-panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={`inline-flex min-h-[44px] items-center gap-2 border-b-2 px-4 py-2.5 text-[15px] transition-colors ${
                isSelected
                  ? "border-[#0369A1] bg-[#F0F9FF]/60 font-semibold text-[#0369A1]"
                  : "border-transparent font-medium text-[#475569] hover:text-[#0F172A]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`inline-flex min-w-[24px] h-[24px] items-center justify-center rounded-md px-1.5 text-[13px] font-semibold tabular-nums ${
                  isSelected
                    ? "bg-[#0369A1] text-[#FFFFFF]"
                    : "bg-[#F1F5F9] text-[#475569]"
                }`}
              >
                {tabCount}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={`users-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`users-tab-${activeTab}`}
        className="space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="w-full sm:max-w-[380px]">
            <label
              htmlFor="admin-users-search"
              className="block mb-2 text-[14px] font-medium text-[#475569]"
            >
              {activeTab === "buyer"
                ? "Cari Pembeli"
                : "Cari Penjual atau Lapak"}
            </label>
            <input
              id="admin-users-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "buyer"
                  ? "Nama, email, atau nomor telepon..."
                  : "Nama pemilik, lapak, dermaga, email..."
              }
              className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {activeTab === "seller" ? (
              <div className="flex items-center gap-2.5">
                <label
                  htmlFor="admin-seller-status-filter"
                  className="text-[14px] font-medium text-[#475569] whitespace-nowrap"
                >
                  Status:
                </label>
                <select
                  id="admin-seller-status-filter"
                  value={sellerStatusFilter}
                  onChange={(e) => setSellerStatusFilter(e.target.value)}
                  className="h-[44px] rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 text-[15px] text-[#0F172A] focus:border-[#0284C7]"
                >
                  <option value="all">Semua Status</option>
                  <option value="approved">Disetujui</option>
                  <option value="pending">Menunggu Verifikasi</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            ) : null}

            <p className="text-[14px] text-[#475569] tabular-nums">
              Menampilkan {filteredList.length} dari {activeTotalCount}{" "}
              {activeNoun}
            </p>
          </div>
        </div>

        {activeTotalCount === 0 ? (
          <EmptyState
            title={
              activeTab === "buyer"
                ? "Belum ada akun Pembeli terdaftar"
                : "Belum ada akun Penjual terdaftar"
            }
            description={
              activeTab === "buyer"
                ? "Pembeli yang mendaftar akan tampil pada tab ini."
                : "Mitra Nelayan yang mendaftar akan tampil pada tab ini."
            }
          />
        ) : filteredList.length === 0 ? (
          <EmptyState
            title={`Tidak ada ${activeNoun} yang cocok`}
            description="Coba ubah kata kunci pencarian atau filter status verifikasi."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
            {activeTab === "buyer" ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[14px] font-medium text-[#475569]">
                    <th className="py-3.5 px-5">Pembeli</th>
                    <th className="py-3.5 px-4">Kontak</th>
                    <th className="py-3.5 px-4 text-right">Pesanan</th>
                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[15px]">
                  {filteredList.map((user) => {
                    const isSelf = user.id === currentAdminId;

                    return (
                      <tr key={user.id} className="align-middle">
                        <td className="py-4 px-5">
                          <p className="font-semibold text-[#0F172A]">
                            {user.full_name}
                          </p>
                          <p className="text-[13px] text-[#64748B]">
                            Bergabung {formatDateTime(user.created_at)}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <p className="text-[#0F172A]">{user.email}</p>
                          <p className="text-[14px] text-[#475569]">
                            {user.phone_number || "-"}
                          </p>
                        </td>

                        <td className="py-4 px-4 text-right tabular-nums text-[#334155]">
                          {user.order_count ?? 0} pesanan
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 py-2 text-[14px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                            >
                              Ubah
                            </button>

                            {!isSelf ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(user)}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-3.5 py-2 text-[14px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2]"
                              >
                                Hapus
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[14px] font-medium text-[#475569]">
                    <th className="py-3.5 px-5">Pemilik & Kontak</th>
                    <th className="py-3.5 px-4">Lapak & Dermaga</th>
                    <th className="py-3.5 px-4">Status Verifikasi</th>
                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[15px]">
                  {filteredList.map((user) => {
                    const isSelf = user.id === currentAdminId;

                    return (
                      <tr key={user.id} className="align-middle">
                        <td className="py-4 px-5">
                          <p className="font-semibold text-[#0F172A]">
                            {user.full_name}
                          </p>
                          <p className="text-[14px] text-[#334155]">
                            {user.email}
                          </p>
                          <p className="text-[14px] text-[#475569]">
                            {user.phone_number || "-"}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-medium text-[#0F172A]">
                            {user.store_name || "-"}
                          </p>
                          <p className="text-[14px] text-[#475569]">
                            {user.dock_location || "Lokasi dermaga belum diisi"}
                          </p>
                          <p className="text-[13px] text-[#64748B] tabular-nums">
                            {user.product_count ?? 0} produk terdaftar ·
                            Bergabung {formatDateTime(user.created_at)}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <StatusBadge
                            variant="seller"
                            status={user.seller_status}
                          />
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 py-2 text-[14px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                            >
                              Ubah
                            </button>

                            {!isSelf ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(user)}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-3.5 py-2 text-[14px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2]"
                              >
                                Hapus
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {editTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4"
          onClick={() => {
            if (!savingEdit) {
              setEditTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={editTitleId}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[460px] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id={editTitleId}
                className="text-[20px] font-semibold text-[#0F172A]"
              >
                {editTarget.role === "seller"
                  ? "Ubah Data Penjual"
                  : "Ubah Data Pembeli"}
              </h2>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                disabled={savingEdit}
                aria-label="Tutup dialog ubah pengguna"
                className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-md border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              {editError ? <ErrorBanner message={editError} /> : null}

              <div>
                <label
                  htmlFor="edit-user-name"
                  className="block mb-2 text-[14px] font-medium text-[#475569]"
                >
                  Nama Lengkap
                </label>
                <input
                  ref={editNameRef}
                  id="edit-user-name"
                  type="text"
                  required
                  maxLength={100}
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A]"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-user-email"
                  className="block mb-2 text-[14px] font-medium text-[#475569]"
                >
                  Email
                </label>
                <input
                  id="edit-user-email"
                  type="email"
                  required
                  maxLength={120}
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A]"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-user-phone"
                  className="block mb-2 text-[14px] font-medium text-[#475569]"
                >
                  Nomor Telepon
                </label>
                <input
                  id="edit-user-phone"
                  type="tel"
                  maxLength={20}
                  value={editForm.phone_number}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      phone_number: e.target.value,
                    }))
                  }
                  className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  disabled={savingEdit}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
                >
                  {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.role === "seller" ? "Hapus Akun Penjual" : "Hapus Akun Pembeli"
        }
        description={`Akun "${deleteTarget?.full_name || ""}" (${
          deleteTarget?.email || ""
        }) akan dihapus permanen dari sistem.`}
        confirmLabel="Ya, Hapus Akun"
        cancelLabel="Batal"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
