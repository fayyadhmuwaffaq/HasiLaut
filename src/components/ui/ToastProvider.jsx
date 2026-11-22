"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertIcon, CloseIcon, VerifiedIcon } from "@/components/ui/Icons";

const DEFAULT_SUCCESS_MS = 4000;
const DEFAULT_ERROR_MS = 5000;
const MAX_VISIBLE_TOASTS = 3;

const ToastContext = createContext({
  showSuccess: () => {},
  showError: () => {},
  dismissToast: () => {},
});

/**
 * Access global top-right toast notifications from any client component.
 */
export function useToast() {
  return useContext(ToastContext);
}

/**
 * Global provider rendering auto-dismissing success and error toasts at top-right below the navbar.
 */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(0);
  const timersRef = useRef(new Map());

  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismissToast = useCallback(
    (id) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((item) => item.id !== id));
    },
    [clearTimer]
  );

  const pushToast = useCallback(
    (message, variant, options = {}) => {
      if (typeof message !== "string" || !message.trim()) {
        return null;
      }

      const id = ++nextIdRef.current;
      const fallbackMs =
        variant === "error" ? DEFAULT_ERROR_MS : DEFAULT_SUCCESS_MS;
      const durationMs =
        typeof options.durationMs === "number" && options.durationMs > 0
          ? options.durationMs
          : fallbackMs;

      const entry = {
        id,
        variant,
        message: message.trim(),
      };

      setToasts((prev) => {
        const combined = [...prev, entry];
        if (combined.length > MAX_VISIBLE_TOASTS) {
          const evicted = combined.slice(0, combined.length - MAX_VISIBLE_TOASTS);
          for (const oldItem of evicted) {
            clearTimer(oldItem.id);
          }
          return combined.slice(-MAX_VISIBLE_TOASTS);
        }
        return combined;
      });

      const timer = setTimeout(() => {
        dismissToast(id);
      }, durationMs);
      timersRef.current.set(id, timer);

      return id;
    },
    [clearTimer, dismissToast]
  );

  const showSuccess = useCallback(
    (message, options) => pushToast(message, "success", options),
    [pushToast]
  );

  const showError = useCallback(
    (message, options) => pushToast(message, "error", options),
    [pushToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const contextValue = useMemo(
    () => ({ showSuccess, showError, dismissToast }),
    [showSuccess, showError, dismissToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div
        aria-label="Notifikasi"
        className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 z-50 sm:w-full sm:max-w-[380px] pointer-events-none flex flex-col gap-2.5"
      >
        {toasts.map((toast) => {
          const isError = toast.variant === "error";
          return (
            <div
              key={toast.id}
              role={isError ? "alert" : "status"}
              aria-live={isError ? "assertive" : "polite"}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border border-l-4 bg-[#FFFFFF] px-4 py-3.5 shadow-lg ${
                isError
                  ? "border-[#B91C1C]/35 border-l-[#B91C1C]"
                  : "border-[#047857]/30 border-l-[#047857]"
              }`}
            >
              {isError ? (
                <AlertIcon
                  size={18}
                  className="mt-0.5 shrink-0 text-[#B91C1C]"
                />
              ) : (
                <VerifiedIcon
                  size={18}
                  className="mt-0.5 shrink-0 text-[#047857]"
                />
              )}

              <p className="min-w-0 flex-1 text-[14px] font-medium text-[#0F172A] leading-snug break-words">
                {toast.message}
              </p>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Tutup notifikasi"
                className="inline-flex h-[44px] w-[44px] -my-2 -mr-2 shrink-0 items-center justify-center rounded-md text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
