"use client";

import { useId, useState } from "react";

/**
 * Right-aligned disclosure control for Admin appeal contact details on /seller/pending.
 */
export default function SellerAppealDetails({ adminContact }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="inline-flex min-h-[44px] items-center bg-transparent p-0 text-[14px] font-semibold text-[#0369A1] hover:text-[#075985] hover:underline transition-colors"
        >
          {expanded ? "Sembunyikan" : "Lihat Detail"}
        </button>
      </div>

      {expanded ? (
        <div
          id={panelId}
          className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5 space-y-3"
        >
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-[#0F172A]">
              Aju Banding ke Admin
            </h2>
            <p className="text-[14px] text-[#475569]">
              Pengajuan banding dilakukan di luar sistem melalui kontak resmi
              Admin berikut. Sertakan email akun, nama lapak, serta penjelasan
              atau bukti perbaikan Anda.
            </p>
          </div>

          <dl className="divide-y divide-[#E2E8F0] text-[14px]">
            <div className="py-2 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#475569]">Penanggung Jawab</dt>
              <dd className="font-medium text-[#0F172A]">
                {adminContact?.full_name || "Admin HasiLaut"}
              </dd>
            </div>
            <div className="py-2 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#475569]">Email Resmi</dt>
              <dd className="font-medium text-[#0F172A]">
                {adminContact?.email || "Belum tersedia"}
              </dd>
            </div>
            <div className="py-2 flex flex-col sm:flex-row sm:justify-between gap-1">
              <dt className="text-[#475569]">Telepon / WhatsApp</dt>
              <dd className="font-medium text-[#0F172A]">
                {adminContact?.phone_number || "Belum tersedia"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
