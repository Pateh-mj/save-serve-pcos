"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";

const LABELS = ["Very poor", "Poor", "Okay", "Good", "Excellent"];

export default function RateVisit({ appointmentId, existing }: { appointmentId: string; existing?: number | null }) {
  const router = useRouter();
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rated, setRated] = useState(existing ?? 0);

  async function rate(value: number) {
    setSaving(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, rating: value }),
      });
      if (res.ok) {
        setRated(value);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Could not save your rating.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (rated) {
    return (
      <span className="flex items-center gap-0.5" title={`You rated this visit: ${LABELS[rated - 1]}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={`w-3.5 h-3.5 ${n <= rated ? "fill-amber-400 text-amber-400" : "text-border"}`} />
        ))}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      <span className="text-xs text-muted-foreground mr-1">Rate:</span>
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : (
        [1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n}: ${LABELS[n - 1]}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => rate(n)}
            className="p-0.5"
          >
            <Star className={`w-4 h-4 ${n <= hover ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
          </button>
        ))
      )}
    </div>
  );
}
