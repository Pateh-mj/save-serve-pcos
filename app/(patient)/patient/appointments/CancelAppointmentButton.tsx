"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";

export default function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Cancel this appointment?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status: AppointmentStatus.CANCELLED }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Could not cancel appointment.");
      }
    } catch (e) {
      console.error(e);
      alert("Error cancelling appointment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-semibold rounded-lg hover:bg-destructive/20 disabled:opacity-60 flex items-center gap-1 transition"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
      Cancel
    </button>
  );
}
