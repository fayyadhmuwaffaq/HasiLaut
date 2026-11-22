"use client";

/**
 * Password field with accessible show/hide toggle button.
 */
export default function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  value,
  onChange,
  showPassword,
  onToggleShow,
  toggleLabel,
  inputRef,
  placeholder,
  required = true,
  helpText,
  errorText,
  errorRole = "alert",
}) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = errorText ? `${id}-error` : undefined;
  const describedBy =
    [helpId, errorId].filter(Boolean).join(" ") || undefined;
  const resolvedToggleLabel =
    toggleLabel ||
    (showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");

  return (
    <div>
      <label
        htmlFor={id}
        className="block mb-2 text-[14px] font-medium text-[#475569]"
      >
        {label}
      </label>

      <div className="flex items-stretch">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(errorText)}
          aria-describedby={describedBy}
          className={`min-h-[44px] w-full flex-1 min-w-0 rounded-l-md border bg-[#FFFFFF] px-3.5 text-[16px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0284C7] ${
            errorText ? "border-[#B91C1C]" : "border-[#64748B]"
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-pressed={showPassword}
          aria-label={resolvedToggleLabel}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-r-md border border-l-0 border-[#64748B] bg-[#F8FAFC] px-3.5 text-[14px] font-medium text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors whitespace-nowrap"
        >
          {showPassword ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>

      {helpText ? (
        <p id={helpId} className="mt-1.5 text-[14px] text-[#64748B]">
          {helpText}
        </p>
      ) : null}

      {errorText ? (
        <p
          id={errorId}
          role={errorRole}
          className="mt-1.5 text-[14px] text-[#B91C1C]"
        >
          {errorText}
        </p>
      ) : null}
    </div>
  );
}
