"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const storeNameRef = useRef(null);

  const [role, setRole] = useState("buyer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [dockLocation, setDockLocation] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function focusFirstError(errors) {
    if (errors.full_name) {
      fullNameRef.current?.focus();
    } else if (errors.email) {
      emailRef.current?.focus();
    } else if (errors.password) {
      passwordRef.current?.focus();
    } else if (errors.confirmPassword) {
      confirmPasswordRef.current?.focus();
    } else if (errors.store_name) {
      storeNameRef.current?.focus();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const nextErrors = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phoneNumber.trim();
    const trimmedStore = storeName.trim();
    const trimmedDock = dockLocation.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      nextErrors.full_name = "Nama lengkap wajib diisi (2 sampai 100 karakter).";
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Masukkan alamat email yang valid.";
    }
    if (trimmedPhone.length > 20) {
      nextErrors.phone_number = "Nomor telepon maksimal 20 karakter.";
    }
    if (password.length < 8) {
      nextErrors.password = "Kata sandi minimal 8 karakter.";
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Konfirmasi kata sandi tidak sama.";
    }
    if (role === "seller") {
      if (trimmedStore.length < 2 || trimmedStore.length > 100) {
        nextErrors.store_name =
          "Nama lapak atau toko wajib diisi (2 sampai 100 karakter).";
      }
      if (trimmedDock.length > 150) {
        nextErrors.dock_location = "Lokasi dermaga maksimal 150 karakter.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          full_name: trimmedName,
          email: trimmedEmail,
          phone_number: trimmedPhone,
          password,
          store_name: role === "seller" ? trimmedStore : undefined,
          dock_location: role === "seller" ? trimmedDock : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data?.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          focusFirstError(data.fieldErrors);
        }
        setFormError(
          data?.error || "Pendaftaran gagal diproses. Silakan periksa data Anda."
        );
        setSubmitting(false);
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setFormError("Terjadi kendala jaringan. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[540px] mx-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8">
      <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A]">
        Daftar Akun HasiLaut
      </h1>
      <p className="mt-2 text-[16px] text-[#475569]">
        Pilih peran Anda sebagai Pembeli atau Mitra Nelayan untuk mulai
        menggunakan platform.
      </p>

      {formError ? (
        <div
          role="alert"
          className="mt-5 rounded-md border border-[#B91C1C] bg-[#FEF2F2] px-4 py-3 text-[15px] font-medium text-[#B91C1C]"
        >
          {formError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <fieldset>
          <legend className="mb-2 text-[14px] font-medium text-[#475569]">
            Jenis Pendaftaran
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex min-h-[44px] items-start gap-3 rounded-md border p-3.5 transition-colors ${
                role === "buyer"
                  ? "border-[#0369A1] bg-[#F0F9FF]"
                  : "border-[#64748B] bg-[#FFFFFF] hover:bg-[#F8FAFC]"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="buyer"
                checked={role === "buyer"}
                onChange={() => setRole("buyer")}
                className="mt-1 h-4 w-4 accent-[#0369A1]"
              />
              <span>
                <span className="block text-[16px] font-semibold text-[#0F172A]">
                  Pembeli
                </span>
                <span className="block mt-0.5 text-[14px] text-[#475569]">
                  Beli hasil laut untuk rumah tangga atau usaha kuliner.
                </span>
              </span>
            </label>

            <label
              className={`flex min-h-[44px] items-start gap-3 rounded-md border p-3.5 transition-colors ${
                role === "seller"
                  ? "border-[#0369A1] bg-[#F0F9FF]"
                  : "border-[#64748B] bg-[#FFFFFF] hover:bg-[#F8FAFC]"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="seller"
                checked={role === "seller"}
                onChange={() => setRole("seller")}
                className="mt-1 h-4 w-4 accent-[#0369A1]"
              />
              <span>
                <span className="block text-[16px] font-semibold text-[#0F172A]">
                  Mitra Nelayan
                </span>
                <span className="block mt-0.5 text-[14px] text-[#475569]">
                  Buka lapak dan jual hasil tangkapan setelah verifikasi Admin.
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="reg-full-name"
            className="block mb-2 text-[14px] font-medium text-[#475569]"
          >
            Nama Lengkap
          </label>
          <input
            ref={fullNameRef}
            id="reg-full-name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            placeholder="Nama lengkap Anda"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            aria-invalid={Boolean(fieldErrors.full_name)}
            aria-describedby={
              fieldErrors.full_name ? "reg-full-name-error" : undefined
            }
            className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
          />
          {fieldErrors.full_name ? (
            <p
              id="reg-full-name-error"
              className="mt-1.5 text-[14px] text-[#B91C1C]"
            >
              {fieldErrors.full_name}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="reg-email"
              className="block mb-2 text-[14px] font-medium text-[#475569]"
            >
              Email
            </label>
            <input
              ref={emailRef}
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={120}
              placeholder="nama@contoh.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "reg-email-error" : undefined}
              className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
            />
            {fieldErrors.email ? (
              <p id="reg-email-error" className="mt-1.5 text-[14px] text-[#B91C1C]">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              className="block mb-2 text-[14px] font-medium text-[#475569]"
            >
              Nomor Telepon
            </label>
            <input
              id="reg-phone"
              name="phone_number"
              type="tel"
              autoComplete="tel"
              maxLength={20}
              placeholder="08xxxxxxxxxx"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              aria-invalid={Boolean(fieldErrors.phone_number)}
              aria-describedby={
                fieldErrors.phone_number ? "reg-phone-error" : undefined
              }
              className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
            />
            {fieldErrors.phone_number ? (
              <p id="reg-phone-error" className="mt-1.5 text-[14px] text-[#B91C1C]">
                {fieldErrors.phone_number}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="reg-password"
              className="block mb-2 text-[14px] font-medium text-[#475569]"
            >
              Kata Sandi
            </label>
            <input
              ref={passwordRef}
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password
                  ? "reg-password-help reg-password-error"
                  : "reg-password-help"
              }
              className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] focus:border-[#0284C7]"
            />
            <p id="reg-password-help" className="mt-1 text-[13px] text-[#64748B]">
              Minimal 8 karakter.
            </p>
            {fieldErrors.password ? (
              <p
                id="reg-password-error"
                className="mt-1 text-[14px] text-[#B91C1C]"
              >
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="reg-confirm-password"
              className="block mb-2 text-[14px] font-medium text-[#475569]"
            >
              Konfirmasi Kata Sandi
            </label>
            <input
              ref={confirmPasswordRef}
              id="reg-confirm-password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={
                fieldErrors.confirmPassword ? "reg-confirm-error" : undefined
              }
              className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] focus:border-[#0284C7]"
            />
            {fieldErrors.confirmPassword ? (
              <p
                id="reg-confirm-error"
                className="mt-1.5 text-[14px] text-[#B91C1C]"
              >
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>
        </div>

        {role === "seller" ? (
          <div className="border-t border-[#E2E8F0] pt-5 space-y-4">
            <p className="text-[15px] font-semibold text-[#0F172A]">
              Informasi Lapak Nelayan
            </p>
            <div>
              <label
                htmlFor="reg-store-name"
                className="block mb-2 text-[14px] font-medium text-[#475569]"
              >
                Nama Lapak / Toko
              </label>
              <input
                ref={storeNameRef}
                id="reg-store-name"
                name="store_name"
                type="text"
                required
                maxLength={100}
                placeholder="Nama lapak atau usaha nelayan"
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
                aria-invalid={Boolean(fieldErrors.store_name)}
                aria-describedby={
                  fieldErrors.store_name ? "reg-store-error" : undefined
                }
                className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
              />
              {fieldErrors.store_name ? (
                <p
                  id="reg-store-error"
                  className="mt-1.5 text-[14px] text-[#B91C1C]"
                >
                  {fieldErrors.store_name}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="reg-dock-location"
                className="block mb-2 text-[14px] font-medium text-[#475569]"
              >
                Lokasi Dermaga / TPI (Opsional)
              </label>
              <input
                id="reg-dock-location"
                name="dock_location"
                type="text"
                maxLength={150}
                placeholder="Contoh: TPI Muara Baru, Jakarta"
                value={dockLocation}
                onChange={(event) => setDockLocation(event.target.value)}
                aria-invalid={Boolean(fieldErrors.dock_location)}
                aria-describedby={
                  fieldErrors.dock_location ? "reg-dock-error" : undefined
                }
                className="h-[44px] w-full rounded-md border border-[#64748B] bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7]"
              />
              {fieldErrors.dock_location ? (
                <p
                  id="reg-dock-error"
                  className="mt-1.5 text-[14px] text-[#B91C1C]"
                >
                  {fieldErrors.dock_location}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] disabled:opacity-50 transition-colors"
        >
          {submitting ? "Mendaftarkan akun..." : "Buat Akun"}
        </button>
      </form>

      <div className="mt-6 border-t border-[#E2E8F0] pt-5 text-[15px] text-[#475569]">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#0369A1] hover:underline"
        >
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
