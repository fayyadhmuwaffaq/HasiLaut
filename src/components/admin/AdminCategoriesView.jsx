"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { EmptyState, ErrorBanner } from "@/components/ui/FeedbackStates";
import { CloseIcon } from "@/components/ui/Icons";

export default function AdminCategoriesView({ initialCategories }) {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const editTitleId = useId();
  const editInputRef = useRef(null);

  useEffect(() => {
    if (!editTarget) {
      return undefined;
    }

    editInputRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !savingEdit) {
        setEditTarget(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editTarget, savingEdit]);

  async function handleCreate(event) {
    event.preventDefault();
    setErrorMessage("");

    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      setErrorMessage("Nama kategori minimal 2 karakter.");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal menambahkan kategori.");
        setCreating(false);
        return;
      }

      setCategories((prev) => [...prev, data.category]);
      setNewName("");
      showSuccess(data?.message || "Kategori ditambahkan.");
      setCreating(false);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat menambah kategori.");
      setCreating(false);
    }
  }

  async function handleSaveEdit(event) {
    event.preventDefault();
    if (!editTarget) {
      return;
    }

    setErrorMessage("");
    setSavingEdit(true);

    try {
      const response = await fetch(`/api/admin/categories/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal memperbarui kategori.");
        setSavingEdit(false);
        return;
      }

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editTarget.id
            ? { ...cat, name: data.category.name, slug: data.category.slug }
            : cat
        )
      );
      showSuccess(data?.message || "Kategori diperbarui.");
      setSavingEdit(false);
      setEditTarget(null);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat memperbarui kategori.");
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
      const response = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal menghapus kategori.");
        setDeleting(false);
        setDeleteTarget(null);
        return;
      }

      setCategories((prev) =>
        prev.filter((cat) => cat.id !== deleteTarget.id)
      );
      showSuccess(data?.message || "Kategori dihapus.");
      setDeleting(false);
      setDeleteTarget(null);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat menghapus kategori.");
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end gap-4 max-w-[680px]"
      >
        <div className="flex-1">
          <label
            htmlFor="new-category-name"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Nama Kategori Baru
          </label>
          <input
            id="new-category-name"
            type="text"
            maxLength={100}
            placeholder="Contoh: Rumput Laut"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[15px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50"
        >
          {creating ? "Menyimpan..." : "Tambah Kategori"}
        </button>
      </form>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {categories.length === 0 ? (
        <EmptyState
          title="Belum ada kategori produk"
          description="Tambahkan kategori hasil laut melalui formulir di atas."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[14px] font-medium text-[#475569]">
                <th className="py-3.5 px-5">Nama Kategori</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4 text-right">Jumlah Produk</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[15px]">
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="py-4 px-5 font-semibold text-[#0F172A]">
                    {cat.name}
                  </td>
                  <td className="py-4 px-4 text-[#475569]">{cat.slug}</td>
                  <td className="py-4 px-4 text-right text-[#0F172A] tabular-nums">
                    {cat.product_count}
                  </td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTarget(cat);
                          setEditName(cat.name);
                          setErrorMessage("");
                        }}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[14px] font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-4 py-2 text-[14px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2]"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
            className="w-full max-w-[440px] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id={editTitleId}
                className="text-[20px] font-semibold text-[#0F172A]"
              >
                Ubah Nama Kategori
              </h2>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                disabled={savingEdit}
                aria-label="Tutup dialog ubah kategori"
                className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-md border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="edit-category-name"
                  className="block mb-2 text-[14px] font-medium text-[#475569]"
                >
                  Nama Kategori
                </label>
                <input
                  ref={editInputRef}
                  id="edit-category-name"
                  type="text"
                  required
                  maxLength={100}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
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
                  {savingEdit ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Kategori"
        description={`Kategori "${deleteTarget?.name || ""}" akan dihapus dari daftar kategori hasil laut.`}
        confirmLabel="Ya, Hapus Kategori"
        cancelLabel="Batal"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
