import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 text-left">
      <h2 className="text-[20px] font-semibold text-[#0F172A]">{title}</h2>
      <p className="mt-2 max-w-[65ch] text-[16px] text-[#475569]">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <div className="mt-5">
          <Link
            href={actionHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] transition-colors"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
      {actionLabel && !actionHref && onAction ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#0369A1] px-5 py-2.5 text-[16px] font-semibold text-[#FFFFFF] hover:bg-[#075985] transition-colors"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ErrorBanner({
  title = "Terjadi kendala",
  message,
  onRetry,
  retryLabel = "Muat Ulang",
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-[#B91C1C] bg-[#FEF2F2] p-4 sm:p-5 text-left"
    >
      <p className="text-[16px] font-semibold text-[#B91C1C]">{title}</p>
      {message ? (
        <p className="mt-1 text-[16px] text-[#7F1D1D]">{message}</p>
      ) : null}
      {onRetry ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#B91C1C] bg-[#FFFFFF] px-4 py-2 text-[16px] font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
          >
            {retryLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function LoadingRows({ count = 3, label = "Memuat data..." }) {
  const rows = Array.from({ length: count }, (_, index) => index);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] divide-y divide-[#E2E8F0]"
    >
      <p className="px-4 py-3 text-[14px] font-medium text-[#475569]">
        {label}
      </p>
      {rows.map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="h-5 w-48 rounded bg-[#E2E8F0]" />
          <div className="h-5 w-28 rounded bg-[#F1F5F9]" />
        </div>
      ))}
    </div>
  );
}
