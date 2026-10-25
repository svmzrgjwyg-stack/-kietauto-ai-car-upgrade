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

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((next: string) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setMessage(next);
    setVisible(true);
    timerRef.current = window.setTimeout(() => {
      setVisible(false);
      setMessage(null);
      timerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {visible && message ? (
        <div
          role="status"
          aria-live="assertive"
          className="pointer-events-none fixed inset-x-0 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] z-[200] flex justify-center px-4"
        >
          <div className="animate-rise max-w-sm rounded-2xl border border-[var(--accent)] bg-[var(--ink)] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45)]">
            {message}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
