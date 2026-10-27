import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TONE_ICON, type Tone } from "./tones";

interface Props {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  tone?: Tone;
  /** One line under the value: context such as "of 12 this month". */
  hint?: React.ReactNode;
  href?: string;
}

/** A headline number tile. With `href` the whole tile links to the detail page. */
export function StatCard({ label, value, icon: Icon, tone = "brand", hint, href }: Props) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`w-9 h-9 rounded-lg inline-flex items-center justify-center shrink-0 ${TONE_ICON[tone]}`}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {href && (
        <p className="mt-3 text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          View details <ArrowRight className="w-3 h-3" />
        </p>
      )}
    </>
  );
  const cls = "group bg-card border border-border rounded-xl p-5 shadow-xs";
  return href ? (
    <Link href={href} className={`${cls} block hover:border-primary/40 hover:shadow-sm transition`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
