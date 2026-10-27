"use client";
import { useState } from "react";
import { formatValue, type Unit } from "./format";

export interface Series {
  name: string;
  /** A CSS colour, normally var(--chart-N). */
  color: string;
}

export interface BarDatum {
  label: string;
  /** One value per series, in series order (stacked bottom to top). */
  values: number[];
}

interface Props {
  data: BarDatum[];
  series: Series[];
  unit?: Unit;
  height?: number;
  /** Accessible summary of what the chart shows. */
  title: string;
}

/**
 * Column chart, single or stacked. Thin columns with 4px rounded tops, a 2px gap between
 * stacked segments, recessive gridlines, a hover tooltip per column, the peak value
 * labelled directly, a legend for 2+ series and a screen-reader table.
 */
export function BarChart({ data, series, unit = "count", height = 180, title }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = data.map((d) => d.values.reduce((a, b) => a + b, 0));
  const max = Math.max(1, ...totals);
  // Counts get a whole-number midpoint label (no "0.5 visits")
  const top = unit === "count" ? Math.max(2, Math.ceil(niceCeil(max) / 2) * 2) : niceCeil(max);
  const peak = totals.indexOf(Math.max(...totals));

  return (
    <figure className="w-full">
      {series.length > 1 && (
        <figcaption className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </figcaption>
      )}

      <div className="flex gap-2">
        {/* y-axis labels */}
        <div className="flex flex-col justify-between text-xs text-muted-foreground text-right shrink-0 -my-1.5" style={{ height }} aria-hidden>
          <span>{formatValue(top, unit, true)}</span>
          <span>{formatValue(top / 2, unit, true)}</span>
          <span>0</span>
        </div>

        <div className="relative flex-1 min-w-0">
          {/* gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height }} aria-hidden>
            <div className="border-t border-chart-grid" />
            <div className="border-t border-chart-grid" />
            <div className="border-t border-chart-axis" />
          </div>

          <div className="relative flex items-end gap-1 sm:gap-2" style={{ height }} onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => {
              const total = totals[i];
              return (
                <div
                  key={d.label}
                  className="relative flex-1 h-full flex flex-col justify-end items-center cursor-default"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  aria-label={`${d.label}: ${series.map((s, k) => `${s.name} ${formatValue(d.values[k] ?? 0, unit)}`).join(", ")}`}
                >
                  {hover === i && <div className="absolute inset-x-0 top-0 bottom-0 bg-secondary/70 rounded-md -z-0" aria-hidden />}
                  {i === peak && total > 0 && hover === null && (
                    <span className="relative text-xs font-semibold text-foreground mb-1" aria-hidden>
                      {formatValue(total, unit, true)}
                    </span>
                  )}
                  <div className="relative w-full max-w-7 flex flex-col-reverse gap-[2px]" style={{ height: `${(total / top) * 100}%` }}>
                    {d.values.map((v, k) =>
                      v > 0 ? (
                        <div
                          key={k}
                          className={`w-full ${k === lastNonZero(d.values) ? "rounded-t-[4px]" : ""}`}
                          style={{ flexGrow: v, flexBasis: 0, minHeight: 2, background: series[k]?.color }}
                        />
                      ) : null
                    )}
                  </div>

                  {hover === i && (
                    <div
                      role="tooltip"
                      className={`absolute z-10 bottom-full mb-2 min-w-36 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md ${
                        i < data.length / 2 ? "left-0" : "right-0"
                      }`}
                    >
                      <p className="font-semibold text-foreground mb-1">{d.label}</p>
                      {series.map((s, k) => (
                        <p key={s.name} className="flex items-center justify-between gap-4 text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                            {s.name}
                          </span>
                          <span className="font-semibold text-foreground">{formatValue(d.values[k] ?? 0, unit)}</span>
                        </p>
                      ))}
                      {series.length > 1 && (
                        <p className="flex justify-between gap-4 mt-1 pt-1 border-t border-border text-foreground font-semibold">
                          <span>Total</span>
                          <span>{formatValue(total, unit)}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* x-axis labels: thinned when crowded */}
          <div className="flex gap-1 sm:gap-2 mt-2" aria-hidden>
            {data.map((d, i) => (
              <span key={d.label} className="flex-1 text-center text-xs text-muted-foreground truncate">
                {i % Math.ceil(data.length / 8) === 0 || i === data.length - 1 ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            {series.map((s) => <th key={s.name} scope="col">{s.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              {series.map((s, k) => <td key={s.name}>{formatValue(d.values[k] ?? 0, unit)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function lastNonZero(values: number[]) {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] > 0) return i;
  return -1;
}

/** Round the axis top up to 1, 2, 2.5 or 5 × a power of ten so gridline labels are tidy. */
function niceCeil(n: number) {
  const pow = 10 ** Math.floor(Math.log10(n));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= n) return m * pow;
  return 10 * pow;
}
