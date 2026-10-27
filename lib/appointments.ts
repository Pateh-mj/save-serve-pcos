import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus, BillingStatus, Role } from "@/lib/constants";
import { moveFunds } from "@/lib/ledger";

/**
 * Allowed status transitions and who may perform them.
 * COMPLETED and CANCELLED are terminal.
 */
const TRANSITIONS: Record<string, Partial<Record<string, string[]>>> = {
  [AppointmentStatus.PENDING]: {
    [AppointmentStatus.CONFIRMED]: [Role.PRACTITIONER, Role.ADMIN],
    [AppointmentStatus.CANCELLED]: [Role.PATIENT, Role.PRACTITIONER, Role.ADMIN],
  },
  [AppointmentStatus.CONFIRMED]: {
    [AppointmentStatus.COMPLETED]: [Role.PRACTITIONER, Role.ADMIN],
    [AppointmentStatus.CANCELLED]: [Role.PATIENT, Role.PRACTITIONER, Role.ADMIN],
  },
};

export function canTransition(from: string, to: string, role: string) {
  return TRANSITIONS[from]?.[to]?.includes(role) ?? false;
}

/**
 * Settles the bill of a cancelled appointment: an unpaid bill is waived and an
 * NGO subsidy is returned to the pool it came from. PAID bills are left as-is.
 */
export async function releaseBillingOnCancel(tx: Prisma.TransactionClient, appointmentId: string) {
  const billing = await tx.billing.findUnique({ where: { appointmentId } });
  if (!billing) return;

  if (billing.status === BillingStatus.SUBSIDIZED) {
    if (billing.ngoId && billing.subsidyAmount) {
      await moveFunds(tx, {
        ngoId: billing.ngoId,
        type: "SUBSIDY_REFUND",
        amount: billing.subsidyAmount,
        billingId: billing.id,
        note: "Appointment cancelled",
      });
    }
    await tx.billing.update({
      where: { id: billing.id },
      data: { status: BillingStatus.WAIVED, subsidyApplied: false },
    });
  } else if (billing.status === BillingStatus.PENDING) {
    await tx.billing.update({
      where: { id: billing.id },
      data: { status: BillingStatus.WAIVED },
    });
  }
}

type TransitionResult =
  | { ok: true; appointment: NonNullable<Awaited<ReturnType<typeof loadAppointment>>> }
  | { ok: false; status: 403 | 404 | 409; error: string };

function loadAppointment(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      billing: true,
      practitioner: { include: { user: true } },
      patient: { include: { user: true } },
    },
  });
}

/**
 * The single path for appointment status changes (web PATCH and USSD cancel):
 * ownership check → transition rules → guarded update → billing release on cancel.
 */
export async function transitionAppointment(input: {
  appointmentId: string;
  to: string;
  actor: { role: string; userId: string };
}): Promise<TransitionResult> {
  const appt = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: { practitioner: true, patient: true },
  });
  if (!appt) return { ok: false, status: 404, error: "Appointment not found" };

  const { role, userId } = input.actor;
  const isOwner =
    role === Role.ADMIN ||
    (role === Role.PATIENT && appt.patient.userId === userId) ||
    (role === Role.PRACTITIONER && appt.practitioner.userId === userId);
  if (!isOwner) return { ok: false, status: 403, error: "Forbidden" };

  if (!canTransition(appt.status, input.to, role)) {
    return { ok: false, status: 409, error: `Cannot change appointment from ${appt.status} to ${input.to}.` };
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Guard on the current status so two concurrent updates can't both apply
    const { count } = await tx.appointment.updateMany({
      where: { id: appt.id, status: appt.status },
      data: { status: input.to },
    });
    if (count === 0) return false;

    if (input.to === AppointmentStatus.CANCELLED) {
      await releaseBillingOnCancel(tx, appt.id);
    }
    return true;
  });

  if (!updated) {
    return { ok: false, status: 409, error: "Appointment was updated by someone else. Please refresh." };
  }

  const appointment = await loadAppointment(appt.id);
  if (!appointment) return { ok: false, status: 404, error: "Appointment not found" };
  return { ok: true, appointment };
}
