"use client";

import { useRef, useState } from "react";
import PasswordInput from "@/components/ui/PasswordInput";
import { useToast } from "@/components/ui/ToastProvider";
import { ErrorBanner } from "@/components/ui/FeedbackStates";

/**
 * Reusable password-change form backed by POST /api/account/password for any signed-in role.
 */
export default function ChangePasswordForm({ idPrefix = "account-pw" }) {
  const { showSuccess } = useToast();
  const currentRef = useRef(null);
  const newRef = useRef(null);
  const confirmRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  function focusFirstInvalid(errors) {
    if (errors.current_password) {
      currentRef.current?.focus();
    } else if (errors.new_password) {
      newRef.current?.focus();
    } else if (errors.confirm_password) {
      confirmRef.current?.focus();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    const nextErrors = {};
    if (!currentPassword) {
      nextErrors.current_password = "Masukkan kata sandi saat ini.";
    }
    if (newPassword.length < 8) {
      nextErrors.new_password = "Kata sandi baru minimal 8 karakter.";
    } else if (newPassword.length > 128) {
      nextErrors.new_password = "Kata sandi baru maksimal 128 karakter.";
    } else if (currentPassword && newPassword === currentPassword) {
      nextErrors.new_password =
        "Kata sandi baru harus berbeda dari kata sandi saat ini.";
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirm_password = "Konfirmasi kata sandi tidak cocok.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
          setFieldErrors(data.fieldErrors);
          focusFirstInvalid(data.fieldErrors);
        } else {
          setServerError(
            data?.error || "Gagal memperbarui kata sandi. Coba lagi."
          );
        }
        setSaving(false);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      showSuccess(data?.message || "Kata sandi berhasil diperbarui.");
      setSaving(false);
    } catch {
      setServerError(
        "Terjadi kendala jaringan saat memperbarui kata sandi."
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError ? <ErrorBanner message={serverError} /> : null}

      <PasswordInput
        id={`${idPrefix}-current`}
        name="current_password"
        label="Kata Sandi Saat Ini"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        showPassword={showCurrent}
        onToggleShow={() => setShowCurrent((prev) => !prev)}
        toggleLabel={
          showCurrent
            ? "Sembunyikan kata sandi saat ini"
            : "Tampilkan kata sandi saat ini"
        }
        inputRef={currentRef}
        errorText={fieldErrors.current_password}
      />

      <PasswordInput
        id={`${idPrefix}-new`}
        name="new_password"
        label="Kata Sandi Baru"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        showPassword={showNew}
        onToggleShow={() => setShowNew((prev) => !prev)}
        toggleLabel={
          showNew ? "Sembunyikan kata sandi baru" : "Tampilkan kata sandi baru"
        }
        inputRef={newRef}
        helpText="Minimal 8 karakter dan berbeda dari kata sandi saat ini."
        errorText={fieldErrors.new_password}
      />

      <PasswordInput
        id={`${idPrefix}-confirm`}
        name="confirm_password"
        label="Konfirmasi Kata Sandi Baru"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        showPassword={showConfirm}
        onToggleShow={() => setShowConfirm((prev) => !prev)}
        toggleLabel={
          showConfirm
            ? "Sembunyikan konfirmasi kata sandi baru"
            : "Tampilkan konfirmasi kata sandi baru"
        }
        inputRef={confirmRef}
        errorText={fieldErrors.confirm_password}
      />

      <div className="pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : "Perbarui Kata Sandi"}
        </button>
      </div>
    </form>
  );
}
