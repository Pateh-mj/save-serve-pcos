"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";
import { toast } from "@/components/app/Toaster";

/** Cancel with an inline "are you sure?" step instead of a browser dialog. */
export default function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status: AppointmentStatus.CANCELLED }),
      });
      if (res.ok) {
        toast.success("Visit cancelled. We've let your practitioner know.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not cancel the visit.");
      }
    } catch {
      toast.error("Network problem: the visit was not cancelled. Please try again.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-danger-border bg-danger-soft pl-2.5 pr-1 py-1">
        <span className="text-xs font-medium text-danger-deep">Cancel visit?</span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="h-6 px-2 rounded-md bg-danger text-white text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-60"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />} Yes
        </button>
        <button onClick={() => setConfirming(false)} disabled={loading} className="h-6 px-2 rounded-md text-xs font-medium text-foreground hover:bg-card">
          Keep
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="h-8 px-3 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-danger-fg hover:border-danger-border hover:bg-danger-soft inline-flex items-center gap-1 transition"
    >
      <X className="w-3.5 h-3.5" /> Cancel
    </button>
  );
}
