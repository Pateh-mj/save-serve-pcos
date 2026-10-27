"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

export interface ProfileField {
  name: string;
  label: string;
  value: string;
  type?: "text" | "tel" | "date" | "textarea";
  placeholder?: string;
  help?: string;
  required?: boolean;
}

const inputCls =
  "mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

/** Generic profile editor: PATCHes the changed values to /api/account/profile. */
export default function ProfileForm({ fields, note }: { fields: ProfileField[]; note?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(fields.map((f) => [f.name, f.value])));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(res.ok ? { ok: true, text: "Profile saved." } : { ok: false, text: data.error ?? "Could not save your profile." });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <label key={f.name} className={`block ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
            <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea
                rows={3}
                value={values[f.name]}
                placeholder={f.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                className={`${inputCls} resize-none`}
              />
            ) : (
              <input
                type={f.type ?? "text"}
                value={values[f.name]}
                placeholder={f.placeholder}
                required={f.required}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                className={inputCls}
              />
            )}
            {f.help && <span className="block text-[11px] text-muted-foreground mt-1">{f.help}</span>}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-xs ${message ? (message.ok ? "text-emerald-700" : "text-destructive") : "text-muted-foreground"}`}>
          {message?.text ?? note ?? ""}
        </p>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save profile
        </button>
      </div>
    </form>
  );
}
