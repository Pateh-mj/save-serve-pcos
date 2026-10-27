"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

interface Props {
  policy: {
    id: string;
    name: string;
    tier: string;
    billingMultiplier: number;
    maxVisitsPerMonth: number | null;
    isActive: boolean;
  };
  fee: number;
}

export function PolicyEditor({ policy, fee }: Props) {
  const router = useRouter();
  const [multiplier, setMultiplier] = useState(String(policy.billingMultiplier));
  const [maxVisits, setMaxVisits] = useState(policy.maxVisitsPerMonth === null ? "" : String(policy.maxVisitsPerMonth));
  const [isActive, setIsActive] = useState(policy.isActive);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const m = Number(multiplier);
  const preview = Number.isFinite(m) ? fee * m : NaN;

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/policies/${policy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingMultiplier: m,
          maxVisitsPerMonth: maxVisits.trim() === "" ? null : Number(maxVisits),
          isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(res.ok ? "Saved. New bookings use this policy immediately." : data.error ?? "Save failed.");
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{policy.tier}</p>
          <h3 className="font-bold text-foreground">{policy.name}</h3>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <label className="block">
          <span className="text-xs text-muted-foreground">Billing multiplier</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Max subsidised visits / month</span>
          <input
            type="number"
            min="0"
            max="31"
            placeholder="No limit"
            value={maxVisits}
            onChange={(e) => setMaxVisits(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background"
          />
        </label>
        <div>
          <span className="text-xs text-muted-foreground">Patient pays per visit</span>
          <p className="mt-1 px-3 py-2 rounded-lg bg-secondary font-bold text-foreground">
            {Number.isFinite(preview) ? `ZMW ${preview.toFixed(2)}` : "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <p className="text-xs text-muted-foreground">{message}</p>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save policy
        </button>
      </div>
    </div>
  );
}

export function FeeEditor({ fee }: { fee: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(fee));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultationFee: Number(value) }),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(res.ok ? "Saved." : data.error ?? "Save failed.");
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="text-xs text-muted-foreground">Standard consultation fee (ZMW)</span>
        <input
          type="number"
          min="1"
          step="5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 w-40 px-3 py-2 rounded-lg border border-input bg-background text-sm font-semibold"
        />
      </label>
      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save fee
      </button>
      {message && <span className="text-xs text-muted-foreground pb-2">{message}</span>}
    </div>
  );
}
