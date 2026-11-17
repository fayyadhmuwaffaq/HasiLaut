"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DeleteRejectedAccountButton({ storeName }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleConfirmDelete() {
    setDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/seller/account", {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.error || "Gagal menghapus akun mitra.");
        setDeleting(false);
        setConfirmOpen(false);
        return;
      }

      await signOut({ callbackUrl: "/login?deleted=1" });
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat menghapus akun.");
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <p role="alert" className="text-[15px] font-medium text-[#B91C1C]">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={deleting}
        className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#B91C1C] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#991B1B] disabled:opacity-50 transition-colors"
      >
        Hapus Akun
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus Akun Mitra"
        description={`Akun dan data lapak ${
          storeName ? `"${storeName}" ` : ""
        }akan dihapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Akun"
        cancelLabel="Batal"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
