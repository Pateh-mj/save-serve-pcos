import { prisma } from "@/lib/prisma";
import { AppointmentStatus, BillingStatus, type Channel } from "@/lib/constants";
import { isSlotAvailable } from "@/lib/availability";
import { calculatePolicyBilling } from "@/lib/policy-guardian";
import { moveFunds } from "@/lib/ledger";
import { assessTriage, type TriageInput } from "@/lib/triage";

interface BookAppointmentInput {
  patientId: string;
  practitionerId: string;
  scheduledAt: Date;
  channel: Channel;
  notes?: string;
  triage?: TriageInput;
}

/** Short human-friendly reference shown on SMS and USSD screens. */
export function appointmentRef(id: string) {
  return id.slice(-6).toUpperCase();
}

/**
 * Shared booking path for the Web and USSD channels:
 * slot check → triage → Policy Guardian billing → appointment + billing + NGO debit in one transaction.
 */
export async function bookAppointment(input: BookAppointmentInput) {
  const available = await isSlotAvailable(input.practitionerId, input.scheduledAt);
  if (!available) return { ok: false as const, error: "SLOT_UNAVAILABLE" as const };

  const triage = assessTriage(input.triage ?? { symptoms: [] });
  const calc = await calculatePolicyBilling({
    patientId: input.patientId,
    practitionerId: input.practitionerId,
  });

  const appointment = await prisma.$transaction(async (tx) => {
    // Serialise concurrent bookings of the same slot, then re-check inside the lock.
    // The lock is transaction-scoped, so it is released on commit/rollback.
    const slotKey = `${input.practitionerId}:${input.scheduledAt.toISOString()}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${slotKey}))`;
    const clash = await tx.appointment.findFirst({
      where: {
        practitionerId: input.practitionerId,
        scheduledAt: input.scheduledAt,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
      select: { id: true },
    });
    if (clash) return null;

    const created = await tx.appointment.create({
      data: {
        patientId: input.patientId,
        practitionerId: input.practitionerId,
        scheduledAt: input.scheduledAt,
        status: AppointmentStatus.PENDING,
        channel: input.channel,
        notes: input.notes,
        triageLevel: triage.level,
        triageScore: triage.score,
        symptoms: triage.symptoms.join(","),
        billing: {
          create: {
            patientId: input.patientId,
            amount: calc.baseAmount,
            discountedAmount: calc.finalAmount,
            tier: calc.tier,
            subsidyApplied: calc.subsidyApplied,
            subsidyAmount: calc.subsidyAmount > 0 ? calc.subsidyAmount : null,
            status: calc.status,
            policyId: calc.policyId,
            ngoId: calc.ngoId,
          },
        },
      },
      include: {
        billing: true,
        practitioner: { include: { user: true } },
      },
    });

    if (calc.status === BillingStatus.SUBSIDIZED && calc.ngoId && created.billing) {
      // Conditional debit so a concurrently drained pool can't go negative
      const debited = await moveFunds(tx, {
        ngoId: calc.ngoId,
        type: "SUBSIDY_DEBIT",
        amount: -calc.subsidyAmount,
        billingId: created.billing.id,
        note: `Subsidised visit ${appointmentRef(created.id)}`,
      });
      if (!debited) {
        created.billing = await tx.billing.update({
          where: { id: created.billing.id },
          data: { status: BillingStatus.WAIVED, subsidyApplied: false, subsidyAmount: null, ngoId: null },
        });
      }
    }

    return created;
  });

  if (!appointment) return { ok: false as const, error: "SLOT_UNAVAILABLE" as const };

  return { ok: true as const, appointment, explanation: calc.explanation, triage };
}
