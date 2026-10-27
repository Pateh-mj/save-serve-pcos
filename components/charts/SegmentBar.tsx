import { formatValue, type Unit } from "./format";

export interface Segment {
  label: string;
  value: number;
  /** A CSS colour (var(--chart-N) for categories, var(--danger) etc. for status). */
  color: string;
  icon?: React.ElementType;
}

/**
 * Part-to-whole bar with a 2px gap between segments and a legend that names every
 * segment with its value and share, so colour never carries meaning alone.
 */
export function SegmentBar({ segments, unit = "count", title }: { segments: Segment[]; unit?: Unit; title: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);

  return (
    <figure>
      <div className="flex h-3 w-full gap-[2px] rounded-full overflow-hidden bg-secondary" role="img" aria-label={title}>
        {total > 0 &&
          segments.filter((s) => s.value > 0).map((s) => (
            <div key={s.label} title={`${s.label}: ${formatValue(s.value, unit)} (${pct(s.value)}%)`} style={{ flexGrow: s.value, flexBasis: 0, background: s.color }} />
          ))}
      </div>
      <figcaption className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-x-4 gap-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-muted-foreground">
                {s.icon && <s.icon className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />}
                {s.label}
              </span>
              <span className="block text-sm font-semibold text-foreground">
                {formatValue(s.value, unit)} <span className="font-normal text-muted-foreground">· {pct(s.value)}%</span>
              </span>
            </span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}

/** A single proportion against a limit, e.g. pool money used or free visits left. */
export function Meter({ value, max, color = "var(--primary)", label }: { value: number; max: number; color?: string; label: string }) {
  const p = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} className="h-2 w-full rounded-full bg-secondary overflow-hidden">
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${p}%`, background: color }} />
    </div>
  );
}
