"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import PasswordInput from "@/components/ui/PasswordInput";

function sanitizeCallbackUrl(rawUrl) {
  if (typeof rawUrl !== "string") {
    return null;
  }
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return null;
  }
  if (trimmed === "/login" || trimmed === "/register") {
    return null;
  }
  return trimmed;
}

function getRedirectDestination(user, callbackUrl) {
  if (!user) {
    return "/";
  }
  if (user.role === "admin") {
    return "/admin";
  }
  if (user.role === "seller") {
    return user.seller_status === "approved"
      ? "/seller/dashboard"
      : "/seller/pending";
  }

  const safeCallback = sanitizeCallbackUrl(callbackUrl);
  if (
    safeCallback &&
    !safeCallback.startsWith("/admin") &&
    !safeCallback.startsWith("/seller")
  ) {
    return safeCallback;
  }
  return "/buyer/home";
}

export default function LoginForm({
  registered = false,
  deleted = false,
  callbackUrl = "",
  initialError = "",
}) {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(
    initialError === "CredentialsSignin"
      ? "Email atau kata sandi tidak sesuai."
      : ""
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const trimmedEmail = email.trim().toLowerCase();
    const nextErrors = {};

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Masukkan alamat email yang valid.";
    }
    if (!password) {
      nextErrors.password = "Masukkan kata sandi Anda.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.email) {
        emailRef.current?.focus();
      } else if (nextErrors.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setFormError("Email atau kata sandi tidak sesuai.");
        setSubmitting(false);
        return;
      }

      const sessionRes = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      const sessionData = sessionRes.ok ? await sessionRes.json() : null;
      const destination = getRedirectDestination(sessionData?.user, callbackUrl);
      window.location.assign(destination);
    } catch {
      setFormError("Terjadi kendala saat masuk. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[460px] mx-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8">
      <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A]">
        Masuk ke HasiLaut
      </h1>
      <p className="mt-2 text-[16px] text-[#475569]">
        Gunakan akun Pembeli, Mitra Nelayan, atau Admin yang telah terdaftar.
      </p>

      {registered ? (
        <div
          role="status"
          className="mt-5 rounded-md border border-[#047857]/30 bg-[#ECFDF5] px-4 py-3 text-[15px] font-medium text-[#047857]"
        >
          Pendaftaran berhasil. Silakan masuk menggunakan email dan kata sandi Anda.
        </div>
      ) : null}

      {deleted ? (
        <div
          role="status"
          className="mt-5 rounded-md border border-[#0369A1]/30 bg-[#F0F9FF] px-4 py-3 text-[15px] font-medium text-[#0369A1]"
        >
          Akun mitra yang ditolak telah berhasil dihapus dari sistem.
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="mt-5 rounded-md border border-[#B91C1C] bg-[#FEF2F2] px-4 py-3 text-[15px] font-medium text-[#B91C1C]"
        >
          {formError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Email
          </label>
          <input
            ref={emailRef}
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@contoh.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
            className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
          />
          {fieldErrors.email ? (
            <p id="login-email-error" className="mt-1.5 text-[14px] text-[#B91C1C]">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <PasswordInput
          id="login-password"
          name="password"
          label="Kata Sandi"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword((prev) => !prev)}
          toggleLabel={
            showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
          }
          inputRef={passwordRef}
          errorText={fieldErrors.password}
          errorRole={undefined}
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50 transition-colors"
        >
          {submitting ? "Memeriksa akun..." : "Masuk ke Akun"}
        </button>
      </form>

      <div className="mt-6 border-t border-[#E2E8F0] pt-5 text-[15px] text-[#475569]">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#0369A1] hover:underline"
        >
          Daftar akun baru
        </Link>
      </div>
    </div>
  );
}
