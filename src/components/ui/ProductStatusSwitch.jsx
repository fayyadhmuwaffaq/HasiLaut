"use client";

/**
 * Shared accessible status switch used in Seller and Admin product tables.
 */
export default function ProductStatusSwitch({
  checked,
  disabled = false,
  onToggle,
  ariaLabel,
  statusLabel,
  statusClassName = "text-[#475569]",
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
      className="inline-flex min-h-[44px] items-center gap-2.5 px-1 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-[#0369A1]" : "bg-[#CBD5E1]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-[#FFFFFF] shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className={`text-[14px] font-semibold ${statusClassName}`}>
        {statusLabel}
      </span>
    </button>
  );
}
