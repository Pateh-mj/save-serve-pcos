"use client";
import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

const inputCls =
  "mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setMessage({ ok: false, text: "The new passwords do not match." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: "Password changed." });
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setMessage({ ok: false, text: data.error ?? "Could not change your password." });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Current password</span>
          <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">New password</span>
          <input type="password" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Confirm new password</span>
          <input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-xs ${message ? (message.ok ? "text-emerald-700" : "text-destructive") : "text-muted-foreground"}`}>
          {message?.text ?? "At least 8 characters."}
        </p>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-muted disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
          Change password
        </button>
      </div>
    </form>
  );
}
