export type Unit = "count" | "zmw" | "percent";

/** Chart value formatting; `compact` shortens axis and peak labels (ZMW 12.5k). */
export function formatValue(n: number, unit: Unit, compact = false) {
  if (unit === "percent") return `${Math.round(n)}%`;
  const num = compact && Math.abs(n) >= 1000
    ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
    : unit === "zmw" && !compact
      ? n.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.round(n * 10) / 10 + "";
  return unit === "zmw" ? `ZMW ${num}` : num;
}
