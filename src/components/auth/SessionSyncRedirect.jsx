"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

export default function SessionSyncRedirect({ target }) {
  const { status, update } = useSession();
  const startedRef = useRef(false);
  const unmountedRef = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || startedRef.current) {
      return;
    }

    startedRef.current = true;

    async function syncAndNavigate() {
      try {
        const updated = await update({});
        if (unmountedRef.current) {
          return;
        }
        if (updated?.user) {
          window.location.assign(target);
        } else {
          setFailed(true);
        }
      } catch {
        if (!unmountedRef.current) {
          setFailed(true);
        }
      }
    }

    syncAndNavigate();
  }, [status, target, update]);

  return (
    <section className="max-w-[680px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-4">
        <h1 className="text-[24px] font-bold text-[#0F172A]">
          Memperbarui Status Sesi Akun
        </h1>
        <p className="text-[16px] text-[#334155]">
          Status verifikasi akun Anda telah diperbarui oleh Admin. Sistem
          sedang mengarahkan Anda ke halaman yang sesuai.
        </p>
        {failed ? (
          <button
            type="button"
            onClick={() => window.location.assign(target)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985]"
          >
            Lanjutkan Sekarang
          </button>
        ) : null}
      </div>
    </section>
  );
}
