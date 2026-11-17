"use client";

import { useId, useState } from "react";
import { MIN_ORDER_KG } from "@/lib/format";

function roundKg(val) {
  return Math.round(val * 100) / 100;
}

export default function QuantityStepper({
  value,
  onChange,
  min = MIN_ORDER_KG,
  max,
  step = 0.5,
  disabled = false,
  id,
  name,
  label = "Jumlah pembelian (Kg)",
  hideLabel = false,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : min;
  const [isEditing, setIsEditing] = useState(false);
  const [rawInput, setRawInput] = useState(String(numericValue));

  const hasMax = typeof max === "number" && Number.isFinite(max);
  const effectiveMax = hasMax ? Math.max(min, roundKg(max)) : undefined;

  function clampKg(nextRaw) {
    let next = roundKg(nextRaw);
    if (!Number.isFinite(next) || next < min) {
      next = min;
    }
    if (effectiveMax !== undefined && next > effectiveMax) {
      next = effectiveMax;
    }
    return next;
  }

  function handleStep(delta) {
    if (disabled) {
      return;
    }
    const base = Number.isFinite(numericValue) ? numericValue : min;
    const candidate = clampKg(base + delta);
    setIsEditing(false);
    setRawInput(String(candidate));
    onChange?.(candidate);
  }

  function handleFocus() {
    setIsEditing(true);
    setRawInput(String(numericValue));
  }

  function handleInputChange(event) {
    const raw = event.target.value;
    setRawInput(raw);

    const normalized = raw.trim().replace(",", ".");
    if (!normalized) {
      return;
    }

    const parsed = Number(normalized);
    if (Number.isFinite(parsed) && parsed >= min) {
      const clamped =
        effectiveMax !== undefined
          ? Math.min(roundKg(parsed), effectiveMax)
          : roundKg(parsed);
      onChange?.(clamped);
    }
  }

  function handleBlur() {
    const normalized = rawInput.trim().replace(",", ".");
    const parsed = Number(normalized);
    const committed = clampKg(Number.isFinite(parsed) ? parsed : numericValue);
    setIsEditing(false);
    setRawInput(String(committed));
    onChange?.(committed);
  }

  const displayValue = isEditing ? rawInput : String(numericValue);
  const canDecrement = !disabled && numericValue > min;
  const canIncrement =
    !disabled && (effectiveMax === undefined || numericValue < effectiveMax);

  return (
    <div className="flex flex-col">
      <label
        htmlFor={inputId}
        className={
          hideLabel
            ? "sr-only"
            : "mb-2 text-[14px] font-medium text-[#475569]"
        }
      >
        {label}
      </label>
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleStep(-step)}
          disabled={!canDecrement}
          aria-label={`Kurangi ${step} kg`}
          className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] text-[18px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] disabled:opacity-45 disabled:hover:bg-[#FFFFFF] transition-colors"
        >
          -
        </button>
        <div className="relative flex items-center">
          <input
            id={inputId}
            name={name}
            type="number"
            inputMode="decimal"
            min={min}
            max={effectiveMax}
            step={step}
            disabled={disabled}
            value={displayValue}
            onFocus={handleFocus}
            onChange={handleInputChange}
            onBlur={handleBlur}
            aria-label={label}
            className="h-[44px] w-[96px] rounded-md border border-[#64748B] bg-[#FFFFFF] px-3 pr-9 text-center text-[16px] font-semibold text-[#0F172A] tabular-nums focus:border-[#0284C7] disabled:bg-[#F1F5F9]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 text-[14px] text-[#64748B]"
          >
            kg
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleStep(step)}
          disabled={!canIncrement}
          aria-label={`Tambah ${step} kg`}
          className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md border border-[#64748B] bg-[#FFFFFF] text-[18px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] disabled:opacity-45 disabled:hover:bg-[#FFFFFF] transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
