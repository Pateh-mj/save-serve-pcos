"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, BellRing } from "lucide-react";

export default function SmsActions() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("SaveServe test message: your SMS integration is working.");
  const [busy, setBusy] = useState<"test" | "reminders" | null>(null);
  const [result, setResult] = useState("");

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    setBusy("test");
    setResult("");
    try {
      const res = await fetch("/api/admin/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, message }),
      });
      const data = await res.json().catch(() => ({}));
      setResult(res.ok ? `Status: ${data.status}${data.error ? ` (${data.error})` : ""}` : data.error ?? "Failed");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function runReminders() {
    setBusy("reminders");
    setResult("");
    try {
      const res = await fetch("/api/admin/reminders", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setResult(
        res.ok
          ? `Reminder job: ${data.reminders} visit reminder(s), ${data.followUpReminders} follow-up reminder(s) sent.`
          : data.error ?? "Failed"
      );
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <form onSubmit={sendTest} className="grid sm:grid-cols-[180px_1fr_auto] gap-3 items-end">
        <label className="block">
          <span className="text-xs text-muted-foreground">Phone number</span>
          <input
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0971234567"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Message ({message.length}/160)</span>
          <input
            value={message}
            maxLength={320}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={busy !== null}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60"
        >
          {busy === "test" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send test SMS
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">{result || "Reminders also run automatically every morning (Vercel Cron)."}</p>
        <button
          onClick={runReminders}
          disabled={busy !== null}
          className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-muted disabled:opacity-60"
        >
          {busy === "reminders" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
          Run reminder job now
        </button>
      </div>
    </div>
  );
}
