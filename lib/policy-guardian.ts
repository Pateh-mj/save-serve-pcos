import { prisma } from "@/lib/prisma";
import { BillingStatus } from "@/lib/constants";
import { clinicDateKey } from "@/lib/format";
import { getConsultationFee } from "@/lib/settings";

export interface PolicyCalculationInput {
  patientId: string;
  practitionerId: string;
  tier?: string;
}

export interface PolicyCalculationResult {
  baseAmount: number;
  finalAmount: number;
  discountedAmount: number;
  subsidyApplied: boolean;
  subsidyAmount: number;
  status: string;
  policyId?: string;
  tier: string;
  /** NGO pool to debit (FREE tier) or credit with the surplus on payment (PREMIUM tier). */
  ngoId?: string;
  ngoContribution: number;
  explanation: string;
}

/** Policy.rules is free-form JSON; tolerate bad data rather than failing a booking. */
function parseRules(rules: string): { maxVisitsPerMonth?: number } {
  try {
    const parsed = JSON.parse(rules);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/** 00:00 on the 1st of the current month, Zambian time (UTC+2, no DST). */
function clinicMonthStart() {
  return new Date(`${clinicDateKey().slice(0, 7)}-01T00:00:00+02:00`);
}

/**
 * Calculates billing, subsidies, and Robin Hood economic distribution
 * based on the patient's registered tier and active policies.
 *
 * Read-only: it does not move NGO funds. The caller applies the fund
 * movement in the same transaction that creates the Billing row
 * (see lib/booking.ts and /api/billing/pay).
 */
export async function calculatePolicyBilling(
  input: PolicyCalculationInput
): Promise<PolicyCalculationResult> {
  // Patient tier (from the database unless given) and the admin-editable fee, fetched together
  const [patient, baseAmount] = await Promise.all([
    input.tier
      ? null
      : prisma.patient.findUnique({ where: { id: input.patientId }, include: { user: { select: { tier: true } } } }),
    getConsultationFee(), // ZMW
  ]);
  const patientTier = input.tier ?? patient?.user?.tier ?? "FREE";

  // Find active policy for this tier
  const policy = await prisma.policy.findFirst({
    where: { tier: patientTier, isActive: true },
  });

  const multiplier = policy ? policy.billingMultiplier : patientTier === "FREE" ? 0 : patientTier === "PREMIUM" ? 2.0 : 1.0;
  const standardCost = baseAmount;
  let finalAmount = baseAmount * multiplier;
  let subsidyApplied = false;
  let subsidyAmount = 0;
  let ngoContribution = 0;
  let ngoId: string | undefined;
  let status: string = BillingStatus.PENDING;
  let explanation = "";

  const maxFreeVisits = policy ? parseRules(policy.rules).maxVisitsPerMonth : undefined;
  const overFreeLimit =
    (patientTier === "FREE" || multiplier === 0) &&
    typeof maxFreeVisits === "number" &&
    (await prisma.billing.count({
      where: {
        patientId: input.patientId,
        status: BillingStatus.SUBSIDIZED, // cancelled visits are WAIVED, so they don't count
        createdAt: { gte: clinicMonthStart() },
      },
    })) >= maxFreeVisits;

  if (overFreeLimit) {
    finalAmount = standardCost;
    status = BillingStatus.PENDING;
    explanation = `Monthly limit of ${maxFreeVisits} subsidised visits reached; standard tariff applies.`;
  } else if (patientTier === "FREE" || multiplier === 0) {
    finalAmount = 0;
    // Sponsor from the best-funded NGO pool that can cover the full fee
    const sponsor = await prisma.nGO.findFirst({
      where: { fundBalance: { gte: baseAmount } },
      orderBy: { fundBalance: "desc" },
    });

    if (sponsor) {
      subsidyApplied = true;
      subsidyAmount = baseAmount;
      ngoContribution = baseAmount;
      ngoId = sponsor.id;
      status = BillingStatus.SUBSIDIZED;
      explanation = "100% Subsidised by NGO Health Equity Pool (Robin Hood Model).";
    } else {
      status = BillingStatus.WAIVED;
      explanation = "Fee waived: no NGO pool currently has funds to sponsor this visit.";
    }
  } else if (patientTier === "PREMIUM" || multiplier > 1.0) {
    status = BillingStatus.PENDING;
    const surplus = finalAmount - standardCost;
    const beneficiary = await prisma.nGO.findFirst({ orderBy: { createdAt: "asc" } });
    ngoId = beneficiary?.id;
    explanation = `Premium rate includes ZMW ${surplus.toFixed(2)} direct contribution to community subsidy pool.`;
  } else {
    // BASIC
    status = BillingStatus.PENDING;
    explanation = "Standard consultation tariff applied.";
  }

  return {
    baseAmount,
    finalAmount,
    discountedAmount: finalAmount,
    subsidyApplied,
    subsidyAmount,
    status,
    policyId: policy?.id,
    tier: patientTier,
    ngoId,
    ngoContribution,
    explanation,
  };
}
