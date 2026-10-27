"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PhoneCall, X, ArrowRight } from "lucide-react";
import UssdPhoneSimulator from "@/components/UssdPhoneSimulator";

export default function UssdSimulatorModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-border text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors"
      >
        <PhoneCall className="w-4 h-4 text-primary" /> Try USSD *384#
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="USSD simulator"
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl p-5 relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 gap-6">
              <div>
                <h3 className="font-bold text-foreground text-base">USSD Simulator</h3>
                <p className="text-xs text-muted-foreground">Press Call to dial *384#</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <UssdPhoneSimulator />

            <Link
              href="/ussd"
              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Open full simulator with guide <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
