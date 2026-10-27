import { clinicDateKey, formatDate } from "@/lib/format";

const DAY = 86_400_000;

/** Monday (clinic time) of the week containing `d`, as a YYYY-MM-DD key. */
function weekKey(d: Date) {
  const key = clinicDateKey(d);
  const local = new Date(`${key}T12:00:00+02:00`);
  const dow = (local.getUTCDay() + 6) % 7; // Monday = 0
  return clinicDateKey(new Date(local.getTime() - dow * DAY));
}

/**
 * Groups items into the last `weeks` calendar weeks (oldest first) and sums a vector per
 * item, e.g. [web, ussd]. Empty weeks are kept so the chart's time axis stays even.
 */
export function weeklyBuckets<T>(items: T[], date: (t: T) => Date, values: (t: T) => number[], weeks: number) {
  const thisWeek = weekKey(new Date());
  const start = new Date(`${thisWeek}T12:00:00+02:00`).getTime();
  const keys = Array.from({ length: weeks }, (_, i) => clinicDateKey(new Date(start - (weeks - 1 - i) * 7 * DAY)));
  const sums = new Map<string, number[]>(keys.map((k) => [k, []]));

  for (const item of items) {
    const bucket = sums.get(weekKey(date(item)));
    if (!bucket) continue;
    values(item).forEach((v, i) => (bucket[i] = (bucket[i] ?? 0) + v));
  }

  const width = Math.max(1, ...items.slice(0, 1).map((t) => values(t).length));
  return keys.map((k) => ({
    label: formatDate(new Date(`${k}T12:00:00+02:00`), { day: "numeric", month: "short" }),
    values: Array.from({ length: width }, (_, i) => sums.get(k)![i] ?? 0),
  }));
}

/** The same, by calendar month (oldest first), labelled "Oct". */
export function monthlyBuckets<T>(items: T[], date: (t: T) => Date, values: (t: T) => number[], months: number) {
  const now = clinicDateKey().slice(0, 7);
  const [y, m] = now.split("-").map(Number);
  const keys = Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (months - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
  const sums = new Map<string, number[]>(keys.map((k) => [k, []]));
  for (const item of items) {
    const bucket = sums.get(clinicDateKey(date(item)).slice(0, 7));
    if (!bucket) continue;
    values(item).forEach((v, i) => (bucket[i] = (bucket[i] ?? 0) + v));
  }
  const width = Math.max(1, ...items.slice(0, 1).map((t) => values(t).length));
  return keys.map((k) => ({
    label: formatDate(new Date(`${k}-15T12:00:00+02:00`), { month: "short" }),
    values: Array.from({ length: width }, (_, i) => sums.get(k)![i] ?? 0),
  }));
}
