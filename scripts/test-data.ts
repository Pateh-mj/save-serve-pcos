import type { PrismaClient } from "@prisma/client";

/** Name the smoke test registers its USSD patient under (scripts/smoke-test.ts). */
export const SMOKE_NAME = "Smoke Tester";

interface CleanOptions {
  /** Extra phone numbers whose data should go (the smoke test passes its random number). */
  phones?: string[];
  /** Delete request timings recorded at or after this moment (the test run's own traffic). */
  metricsSince?: Date;
  /** Also (or instead) remove every user whose email ends with this, e.g. sample-activity patients. */
  emailSuffix?: string;
  /** Include smoke-test patients (default true). */
  smoke?: boolean;
}

/**
 * Removes everything created by smoke-test runs: the test patients with their visits,
 * bills, records and ratings (cascade), their SMS and USSD sessions, and the ledger
 * entries for their bills. NGO pool balances are then recomputed from what is left in
 * the ledger, so the "pools reconcile" integrity check keeps passing.
 */
export async function cleanTestData(prisma: PrismaClient, opts: CleanOptions = {}) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        ...(opts.smoke === false ? [] : [{ name: SMOKE_NAME }]),
        ...(opts.phones?.length ? [{ phone: { in: opts.phones } }] : []),
        ...(opts.emailSuffix ? [{ email: { endsWith: opts.emailSuffix } }] : []),
      ],
    },
    select: { id: true, phone: true, patient: { select: { billings: { select: { id: true } } } } },
  });
  const userIds = users.map((u) => u.id);
  const phones = [...new Set([...(opts.phones ?? []), ...users.flatMap((u) => (u.phone ? [u.phone] : []))])];
  const billingIds = users.flatMap((u) => u.patient?.billings.map((b) => b.id) ?? []);

  const result = await prisma.$transaction(async (tx) => {
    const ledger = await tx.fundTransaction.deleteMany({ where: { billingId: { in: billingIds } } });
    const sms = await tx.smsMessage.deleteMany({
      where: { OR: [{ userId: { in: userIds } }, { to: { in: phones } }, { appointment: { patient: { userId: { in: userIds } } } }] },
    });
    const sessions = await tx.uSSDSession.deleteMany({
      where: { OR: [{ phone: { in: phones } }, { sessionId: { startsWith: "SMOKE-" } }] },
    });
    // Cascades to Patient → Appointment, Billing, EHRRecord, Feedback
    const removed = await tx.user.deleteMany({ where: { id: { in: userIds } } });
    const metrics = opts.metricsSince
      ? await tx.requestMetric.deleteMany({ where: { createdAt: { gte: opts.metricsSince } } })
      : { count: 0 };

    // Each pool's balance is the sum of its ledger
    const sums = await tx.fundTransaction.groupBy({ by: ["ngoId"], _sum: { amount: true } });
    const byNgo = new Map(sums.map((s) => [s.ngoId, s._sum.amount ?? 0]));
    for (const ngo of await tx.nGO.findMany({ select: { id: true } })) {
      await tx.nGO.update({ where: { id: ngo.id }, data: { fundBalance: Math.round((byNgo.get(ngo.id) ?? 0) * 100) / 100 } });
    }

    return { users: removed.count, ledger: ledger.count, sms: sms.count, sessions: sessions.count, metrics: metrics.count };
  }, { maxWait: 10_000, timeout: 30_000 });

  return result;
}
