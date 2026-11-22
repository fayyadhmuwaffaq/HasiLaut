"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/ToastProvider";
import { ErrorBanner } from "@/components/ui/FeedbackStates";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Shared editable account identity form with NextAuth session refresh.
 */
export default function AccountIdentityForm({
  endpoint,
  idPrefix = "account",
  initialFullName,
  initialEmail,
  initialPhone = "",
  showPhone = false,
  roleLabel = "",
  submitLabel = "Simpan Identitas",
  defaultSuccessMessage = "Identitas akun berhasil diperbarui.",
  onSuccess,
}) {
  const router = useRouter();
  const { update } = useSession();
  const { showSuccess } = useToast();
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);

  const [fullName, setFullName] = useState(initialFullName || "");
  const [email, setEmail] = useState(initialEmail || "");
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || "");
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  function focusFirstInvalid(errors) {
    if (errors.full_name) {
      nameRef.current?.focus();
    } else if (errors.email) {
      emailRef.current?.focus();
    } else if (errors.phone_number) {
      phoneRef.current?.focus();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phoneNumber.trim();
    const nextErrors = {};

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      nextErrors.full_name =
        "Nama lengkap wajib diisi (2 sampai 100 karakter).";
    }
    if (
      !trimmedEmail ||
      trimmedEmail.length > 120 ||
      !EMAIL_PATTERN.test(trimmedEmail)
    ) {
      nextErrors.email =
        "Masukkan alamat email yang valid (maksimal 120 karakter).";
    }
    if (showPhone && trimmedPhone.length > 20) {
      nextErrors.phone_number = "Nomor telepon maksimal 20 karakter.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    const payload = {
      full_name: trimmedName,
      email: trimmedEmail,
    };
    if (showPhone) {
      payload.phone_number = trimmedPhone;
    }

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
          setFieldErrors(data.fieldErrors);
          focusFirstInvalid(data.fieldErrors);
        } else {
          setServerError(data?.error || "Gagal memperbarui identitas akun.");
        }
        setSaving(false);
        return;
      }

      const savedUser = data?.user || data?.profile;
      if (savedUser) {
        setFullName(savedUser.full_name || "");
        setEmail(savedUser.email || "");
        if (showPhone) {
          setPhoneNumber(savedUser.phone_number || "");
        }
        onSuccess?.(savedUser);
      }

      await update({}).catch(() => null);
      showSuccess(data?.message || defaultSuccessMessage);
      setSaving(false);
      router.refresh();
    } catch {
      setServerError("Terjadi kendala jaringan saat memperbarui identitas.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError ? <ErrorBanner message={serverError} /> : null}

      <div>
        <label
          htmlFor={`${idPrefix}-full-name`}
          className="block mb-2 text-[14px] font-medium text-[#475569]"
        >
          Nama Lengkap
        </label>
        <input
          ref={nameRef}
          id={`${idPrefix}-full-name`}
          name="full_name"
          type="text"
          autoComplete="name"
          required
          maxLength={100}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          aria-invalid={Boolean(fieldErrors.full_name)}
          aria-describedby={
            fieldErrors.full_name ? `${idPrefix}-full-name-error` : undefined
          }
          className={`h-[44px] w-full rounded-md border bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] focus:border-[#0284C7] ${
            fieldErrors.full_name ? "border-[#B91C1C]" : "border-[#64748B]"
          }`}
        />
        {fieldErrors.full_name ? (
          <p
            id={`${idPrefix}-full-name-error`}
            role="alert"
            className="mt-1.5 text-[14px] text-[#B91C1C]"
          >
            {fieldErrors.full_name}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-email`}
          className="block mb-2 text-[14px] font-medium text-[#475569]"
        >
          Email
        </label>
        <input
          ref={emailRef}
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={120}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email ? `${idPrefix}-email-error` : undefined
          }
          className={`h-[44px] w-full rounded-md border bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] focus:border-[#0284C7] ${
            fieldErrors.email ? "border-[#B91C1C]" : "border-[#64748B]"
          }`}
        />
        {fieldErrors.email ? (
          <p
            id={`${idPrefix}-email-error`}
            role="alert"
            className="mt-1.5 text-[14px] text-[#B91C1C]"
          >
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      {showPhone ? (
        <div>
          <label
            htmlFor={`${idPrefix}-phone`}
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Nomor Telepon
          </label>
          <input
            ref={phoneRef}
            id={`${idPrefix}-phone`}
            name="phone_number"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="08xxxxxxxxxx"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            aria-invalid={Boolean(fieldErrors.phone_number)}
            aria-describedby={
              fieldErrors.phone_number ? `${idPrefix}-phone-error` : undefined
            }
            className={`h-[44px] w-full rounded-md border bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7] ${
              fieldErrors.phone_number ? "border-[#B91C1C]" : "border-[#64748B]"
            }`}
          />
          {fieldErrors.phone_number ? (
            <p
              id={`${idPrefix}-phone-error`}
              role="alert"
              className="mt-1.5 text-[14px] text-[#B91C1C]"
            >
              {fieldErrors.phone_number}
            </p>
          ) : null}
        </div>
      ) : null}

      {roleLabel ? (
        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 flex items-center justify-between text-[14px]">
          <span className="text-[#475569]">Peran</span>
          <span className="font-semibold text-[#0F172A]">{roleLabel}</span>
        </div>
      ) : null}

      <div className="pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
