import { prisma } from "@/lib/prisma";
import { BillingStatus, Role } from "@/lib/constants";
import { moveFunds } from "@/lib/ledger";

export const PaymentMethod = {
  AIRTEL_MONEY: "AIRTEL_MONEY",
  MTN_MOMO: "MTN_MOMO",
  ZAMTEL_KWACHA: "ZAMTEL_KWACHA",
  CARD: "CARD",
} as const;

type PayResult =
  | { ok: true; alreadySettled: boolean; billingId: string; amountPaid: number }
  | { ok: false; status: 403 | 404; error: string };

/**
 * The single payment path (web and USSD). Payment collection itself is simulated
 * (report §1.10 delimitation); settlement and the Robin Hood credit are real.
 */
export async function payBilling(input: {
  billingId: string;
  actor: { role: string; userId: string };
}): Promise<PayResult> {
  const billing = await prisma.billing.findUnique({
    where: { id: input.billingId },
    include: { patient: true },
  });
  if (!billing) return { ok: false, status: 404, error: "Billing record not found" };

  const { role, userId } = input.actor;
  if (role !== Role.ADMIN && !(role === Role.PATIENT && billing.patient.userId === userId)) {
    return { ok: false, status: 403, error: "Unauthorized to pay this bill" };
  }

  const amountPaid = billing.discountedAmount ?? billing.amount;
  if (billing.status !== BillingStatus.PENDING) {
    return { ok: true, alreadySettled: true, billingId: billing.id, amountPaid: 0 };
  }

  const paid = await prisma.$transaction(async (tx) => {
    // Guard on PENDING so a double-submit can't pay (and credit the pool) twice
    const { count } = await tx.billing.updateMany({
      where: { id: billing.id, status: BillingStatus.PENDING },
      data: { status: BillingStatus.PAID },
    });
    if (count === 0) return false;

    // Robin Hood: the premium surplus reaches the NGO pool once actually paid
    const surplus = amountPaid - billing.amount;
    if (billing.ngoId && surplus > 0) {
      await moveFunds(tx, {
        ngoId: billing.ngoId,
        type: "PREMIUM_CREDIT",
        amount: surplus,
        billingId: billing.id,
        note: "Premium surplus (Robin Hood)",
      });
    }
    return true;
  });

  return { ok: true, alreadySettled: !paid, billingId: billing.id, amountPaid: paid ? amountPaid : 0 };
}
