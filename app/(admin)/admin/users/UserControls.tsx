"use client";
import { toast } from "@/components/app/Toaster";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldOff, Pencil, Check, X } from "lucide-react";
import { Role, Tier } from "@/lib/constants";

interface Props {
  user: {
    id: string;
    role: string;
    tier: string;
    phone: string | null;
    isVerified?: boolean;
  };
}

export default function UserControls({ user }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState(user.phone ?? "");

  async function update(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Update failed.");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      {editingPhone ? (
        <span className="flex items-center gap-1">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0971234567"
            className="w-32 px-2 py-1 text-xs rounded-lg border border-input bg-background"
          />
          <button
            aria-label="Save phone"
            onClick={async () => (await update({ phone: phone || null })) && setEditingPhone(false)}
            className="p-1 rounded-md hover:bg-secondary text-success-fg"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button aria-label="Cancel" onClick={() => setEditingPhone(false)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ) : (
        <button
          onClick={() => setEditingPhone(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-border hover:bg-secondary text-muted-foreground"
        >
          <Pencil className="w-3 h-3" /> Phone
        </button>
      )}

      {user.role === Role.PATIENT && (
        <select
          value={user.tier}
          disabled={saving}
          onChange={(e) => update({ tier: e.target.value })}
          className="px-2 py-1 text-xs rounded-lg border border-input bg-background font-semibold"
          aria-label="Billing tier"
        >
          {Object.values(Tier).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}

      {user.isVerified !== undefined && (
        <button
          disabled={saving}
          onClick={() => update({ isVerified: !user.isVerified })}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border ${
            user.isVerified
              ? "bg-success-soft text-success-fg border-success-border hover:bg-success-muted"
              : "bg-warning-soft text-warning-fg border-warning-border hover:bg-warning-muted"
          }`}
        >
          {user.isVerified ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
          {user.isVerified ? "Verified" : "Verify licence"}
        </button>
      )}

      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
