import { prisma } from "@/lib/prisma";

/** Records one timed operation for the evaluation dashboard. Never throws. */
export async function recordMetric(channel: "USSD" | "WEB" | "SMS", action: string, durationMs: number, ok: boolean) {
  try {
    await prisma.requestMetric.create({
      data: { channel, action, durationMs: Math.round(durationMs), ok },
    });
  } catch (err) {
    console.warn("Could not record metric:", err);
  }
}

/** p-th percentile (0–100) of a list of numbers, nearest-rank method. */
export function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}
