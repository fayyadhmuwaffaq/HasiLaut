"use client";

import { useEffect, useId, useRef } from "react";
import { CloseIcon } from "@/components/ui/Icons";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  destructive = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    const focusTarget = cancelRef.current || dialogRef.current;
    focusTarget?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !loading) {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === "function"
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [open, loading, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4"
      onClick={() => {
        if (!loading) {
          onClose?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[460px] rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-[20px] font-semibold text-[#0F172A]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup dialog"
            className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] disabled:opacity-50"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <p id={descId} className="mt-3 text-[16px] text-[#334155]">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[16px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-md px-5 py-2 text-[16px] font-semibold text-[#FFFFFF] disabled:opacity-50 transition-colors ${
              destructive
                ? "bg-[#B91C1C] hover:bg-[#991B1B]"
                : "bg-[#0369A1] hover:bg-[#075985]"
            }`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
