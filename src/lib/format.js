export const MIN_ORDER_KG = 0.5;

export const ORDER_STATUS_META = {
  pending_payment: {
    label: "Menunggu Pembayaran",
    badgeClass: "bg-[#FFFBEB] text-[#B45309]",
  },
  processing: {
    label: "Diproses",
    badgeClass: "bg-[#F0F9FF] text-[#0369A1]",
  },
  shipped: {
    label: "Dikirim",
    badgeClass: "bg-[#F0F9FF] text-[#0369A1]",
  },
  completed: {
    label: "Selesai",
    badgeClass: "bg-[#ECFDF5] text-[#047857]",
  },
  cancelled: {
    label: "Dibatalkan",
    badgeClass: "bg-[#FEF2F2] text-[#B91C1C]",
  },
};

export const SELLER_STATUS_META = {
  pending: {
    label: "Menunggu Verifikasi",
    badgeClass: "bg-[#FFFBEB] text-[#B45309]",
  },
  approved: {
    label: "Disetujui",
    badgeClass: "bg-[#ECFDF5] text-[#047857]",
  },
  rejected: {
    label: "Ditolak",
    badgeClass: "bg-[#FEF2F2] text-[#B91C1C]",
  },
};

export const PAYMENT_METHOD_LABELS = {
  cod: "Bayar di Tempat (COD)",
  bank_transfer: "Transfer Bank Manual",
};

export function formatRupiah(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "Rp 0";
  }

  const isWhole = Number.isInteger(amount);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(amount);
}

export function formatKg(value) {
  const kg = Number(value);
  if (!Number.isFinite(kg)) {
    return "0 kg";
  }

  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kg);

  return `${formatted} kg`;
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Parse and normalize a Kg quantity (must be finite and >= 0.5 kg).
 */
export function parseQuantityKg(rawValue) {
  const normalized =
    typeof rawValue === "string" ? rawValue.trim().replace(",", ".") : rawValue;
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < MIN_ORDER_KG) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

export function parseNonNegativeDecimal(rawValue) {
  const normalized =
    typeof rawValue === "string" ? rawValue.trim().replace(",", ".") : rawValue;
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
