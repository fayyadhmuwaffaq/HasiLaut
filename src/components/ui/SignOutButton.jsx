"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function SignOutButton({ className = "", onBeforeSignOut }) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    onBeforeSignOut?.();
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] px-4 py-2 text-[15px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] active:bg-[#E2E8F0] disabled:opacity-50 transition-colors ${className}`}
    >
      {pending ? "Keluar..." : "Keluar"}
    </button>
  );
}
