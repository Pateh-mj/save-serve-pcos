import {
  Clock, CheckCircle2, CircleCheckBig, XCircle, Siren, AlertTriangle, Activity,
  Wallet, HeartHandshake, BadgeCheck, Send, CircleSlash, Smartphone, Globe, Star,
} from "lucide-react";
import { TONE_BADGE, type Tone } from "./tones";

type Spec = { label: string; tone: Tone; icon?: React.ElementType };

/**
 * Every status the app shows, in one place. Colour never carries meaning alone:
 * each badge has an icon and a label.
 */
const KINDS = {
  appointment: {
    PENDING: { label: "Pending", tone: "warning", icon: Clock },
    CONFIRMED: { label: "Confirmed", tone: "info", icon: CheckCircle2 },
    COMPLETED: { label: "Completed", tone: "success", icon: CircleCheckBig },
    CANCELLED: { label: "Cancelled", tone: "neutral", icon: XCircle },
  },
  triage: {
    EMERGENCY: { label: "Emergency", tone: "danger", icon: Siren },
    URGENT: { label: "Urgent", tone: "warning", icon: AlertTriangle },
    ROUTINE: { label: "Routine", tone: "neutral", icon: Activity },
  },
  billing: {
    PENDING: { label: "Unpaid", tone: "warning", icon: Wallet },
    PAID: { label: "Paid", tone: "success", icon: BadgeCheck },
    SUBSIDIZED: { label: "Subsidised", tone: "brand", icon: HeartHandshake },
    WAIVED: { label: "Waived", tone: "neutral", icon: CircleSlash },
  },
  sms: {
    QUEUED: { label: "Queued", tone: "neutral", icon: Clock },
    SENT: { label: "Sent", tone: "info", icon: Send },
    DELIVERED: { label: "Delivered", tone: "success", icon: CircleCheckBig },
    FAILED: { label: "Failed", tone: "danger", icon: XCircle },
    SKIPPED: { label: "Skipped", tone: "neutral", icon: CircleSlash },
  },
  tier: {
    FREE: { label: "Free · subsidised", tone: "brand", icon: HeartHandshake },
    BASIC: { label: "Basic", tone: "info" },
    PREMIUM: { label: "Premium", tone: "premium", icon: Star },
  },
  channel: {
    WEB: { label: "Web", tone: "neutral", icon: Globe },
    USSD: { label: "USSD", tone: "neutral", icon: Smartphone },
  },
} satisfies Record<string, Record<string, Spec>>;

export type StatusKind = keyof typeof KINDS;

export function statusSpec(kind: StatusKind, value: string): Spec {
  return (KINDS[kind] as Record<string, Spec>)[value] ?? { label: value.charAt(0) + value.slice(1).toLowerCase(), tone: "neutral" };
}

export function StatusBadge({ kind, value, solid }: { kind: StatusKind; value: string; solid?: boolean }) {
  const { label, tone, icon: Icon } = statusSpec(kind, value);
  // A solid badge is reserved for things that must not be missed (an active emergency)
  const cls = solid && tone === "danger" ? "bg-danger text-white border-danger" : TONE_BADGE[tone];
  return (
    <span className={`inline-flex items-center gap-1 h-6 px-2 rounded-full border text-xs font-semibold whitespace-nowrap ${cls}`}>
      {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />}
      {label}
    </span>
  );
}
