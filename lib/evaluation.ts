import { prisma } from "@/lib/prisma";
import { AppointmentStatus, BillingStatus } from "@/lib/constants";
import { percentile } from "@/lib/metrics";

// Evaluation instrumentation for report objective 4 / RQ4:
// response time, synchronisation accuracy and user satisfaction.

export interface TimingStats {
  label: string;
  count: number;
  avg: number;
  p50: number;
  p95: number;
  max: number;
  successRate: number;
}

export interface IntegrityCheck {
  name: string;
  detail: string;
  passed: boolean;
  /** Informational checks never fail the run */
  informational?: boolean;
}

function timing(label: string, rows: { durationMs: number; ok: boolean }[]): TimingStats {
  const durations = rows.map((r) => r.durationMs);
  return {
    label,
    count: rows.length,
    avg: rows.length ? Math.round(durations.reduce((a, b) => a + b, 0) / rows.length) : 0,
    p50: percentile(durations, 50),
    p95: percentile(durations, 95),
    max: rows.length ? Math.max(...durations) : 0,
    successRate: rows.length ? rows.filter((r) => r.ok).length / rows.length : 0,
  };
}

export async function getEvaluationReport(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000);

  const [metrics, smsByStatus, smsSegments, apptsByChannel, sessions, sessionsResumed, feedback, ngos] = await Promise.all([
    prisma.requestMetric.findMany({
      where: { createdAt: { gte: since } },
      select: { channel: true, action: true, durationMs: true, ok: true },
      orderBy: { createdAt: "desc" },
      take: 20_000,
    }),
    prisma.smsMessage.groupBy({ by: ["status"], where: { createdAt: { gte: since } }, _count: true }),
    prisma.smsMessage.aggregate({
      where: { createdAt: { gte: since }, status: { in: ["SENT", "DELIVERED"] } },
      _sum: { segments: true },
    }),
    prisma.appointment.groupBy({ by: ["channel"], where: { createdAt: { gte: since } }, _count: true }),
    prisma.uSSDSession.findMany({
      where: { createdAt: { gte: since } },
      select: { state: true, completed: true },
    }),
    prisma.uSSDSession.count({ where: { createdAt: { gte: since }, data: { contains: "resumePath" } } }),
    prisma.feedback.findMany({ where: { createdAt: { gte: since } }, select: { rating: true, channel: true } }),
    prisma.nGO.findMany({ select: { id: true, name: true, fundBalance: true } }),
  ]);

  // ─── Response time ──
  const timings = [
    timing("USSD menu hop (all screens)", metrics.filter((m) => m.channel === "USSD")),
    timing("USSD booking confirmation", metrics.filter((m) => m.action === "ussd.book.confirmed")),
    timing("Web booking (API)", metrics.filter((m) => m.action === "booking.create")),
    timing("SMS provider send", metrics.filter((m) => m.channel === "SMS")),
  ];

  // ─── USSD funnel ──
  const bookingSessions = sessions.filter((s) => s.state.startsWith("1*") || s.state === "1");
  const ussd = {
    sessions: sessions.length,
    bookingSessions: bookingSessions.length,
    bookingsConfirmed: metrics.filter((m) => m.action === "ussd.book.confirmed").length,
    abandoned: sessions.filter((s) => !s.completed).length,
    resumed: sessionsResumed,
  };

  // ─── SMS ──
  const smsCounts = Object.fromEntries(smsByStatus.map((s) => [s.status, s._count])) as Record<string, number>;
  const smsAttempted = (smsCounts.SENT ?? 0) + (smsCounts.DELIVERED ?? 0) + (smsCounts.FAILED ?? 0);
  const sms = {
    counts: smsCounts,
    deliveryRate: smsAttempted ? ((smsCounts.SENT ?? 0) + (smsCounts.DELIVERED ?? 0)) / smsAttempted : 0,
    segmentsUsed: smsSegments._sum.segments ?? 0,
  };

  // ─── Satisfaction ──
  const distribution = [1, 2, 3, 4, 5].map((r) => feedback.filter((f) => f.rating === r).length);
  const satisfaction = {
    count: feedback.length,
    average: feedback.length ? feedback.reduce((a, f) => a + f.rating, 0) / feedback.length : 0,
    distribution,
    byChannel: ["WEB", "USSD"].map((c) => {
      const rows = feedback.filter((f) => f.channel === c);
      return { channel: c, count: rows.length, average: rows.length ? rows.reduce((a, f) => a + f.rating, 0) / rows.length : 0 };
    }),
  };

  // ─── Synchronisation & financial integrity ──
  const [noBilling, badSubsidy, cancelledStillSubsidised, completedNoEhr, ledgerSums] = await Promise.all([
    prisma.appointment.count({ where: { billing: { is: null } } }),
    prisma.billing.count({
      where: {
        status: BillingStatus.SUBSIDIZED,
        OR: [{ ngoId: null }, { subsidyAmount: null }, { discountedAmount: { not: 0 } }],
      },
    }),
    prisma.billing.count({
      where: { status: BillingStatus.SUBSIDIZED, appointment: { status: AppointmentStatus.CANCELLED } },
    }),
    prisma.appointment.count({ where: { status: AppointmentStatus.COMPLETED, ehrRecord: { is: null } } }),
    prisma.fundTransaction.groupBy({ by: ["ngoId"], _sum: { amount: true } }),
  ]);

  const ledgerByNgo = new Map(ledgerSums.map((l) => [l.ngoId, l._sum.amount ?? 0]));
  const unreconciled = ngos.filter((n) => Math.abs(n.fundBalance - (ledgerByNgo.get(n.id) ?? 0)) > 0.01);

  const checks: IntegrityCheck[] = [
    {
      name: "Every appointment (Web and USSD) has a billing record",
      detail: `${noBilling} appointment(s) without billing`,
      passed: noBilling === 0,
    },
    {
      name: "Subsidised bills are fully funded by an NGO pool",
      detail: `${badSubsidy} inconsistent subsidised bill(s)`,
      passed: badSubsidy === 0,
    },
    {
      name: "Cancelled visits return their subsidy to the pool",
      detail: `${cancelledStillSubsidised} cancelled visit(s) still holding a subsidy`,
      passed: cancelledStillSubsidised === 0,
    },
    {
      name: "NGO pool balances reconcile with the fund ledger",
      detail:
        unreconciled.length === 0
          ? `${ngos.length} pool(s) reconcile to the kwacha`
          : unreconciled
              .map((n) => `${n.name}: balance ${n.fundBalance.toFixed(2)} vs ledger ${(ledgerByNgo.get(n.id) ?? 0).toFixed(2)}`)
              .join("; "),
      passed: unreconciled.length === 0,
    },
    {
      name: "Completed visits have a clinical record",
      detail: `${completedNoEhr} completed visit(s) without an EHR entry`,
      passed: completedNoEhr === 0,
      informational: true,
    },
  ];

  return {
    days,
    timings,
    ussd,
    sms,
    satisfaction,
    channels: Object.fromEntries(apptsByChannel.map((c) => [c.channel, c._count])) as Record<string, number>,
    checks,
  };
}
