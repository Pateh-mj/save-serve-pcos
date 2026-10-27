"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Kind = "success" | "error";
type Toast = { id: number; kind: Kind; message: string };

const EVENT = "saveserve:toast";
let nextId = 1;

function emit(kind: Kind, message: string) {
  window.dispatchEvent(new CustomEvent<Toast>(EVENT, { detail: { id: nextId++, kind, message } }));
}

/** Non-blocking notifications, used instead of window.alert(). */
export const toast = {
  success: (message: string) => emit("success", message),
  error: (message: string) => emit("error", message),
};

/** Mounted once in the root layout. */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const t = (e as CustomEvent<Toast>).detail;
      setToasts((list) => [...list.slice(-2), t]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), t.kind === "error" ? 6000 : 3500);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" className="fixed z-[60] bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 flex flex-col gap-2 sm:w-96">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={`flex items-start gap-3 rounded-xl border bg-card p-4 shadow-lg animate-in slide-in-from-bottom-2 fade-in ${
            t.kind === "error" ? "border-danger-border" : "border-success-border"
          }`}
        >
          {t.kind === "error" ? (
            <AlertCircle className="w-5 h-5 text-danger shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          )}
          <p className="flex-1 text-sm text-foreground">{t.message}</p>
          <button
            onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
