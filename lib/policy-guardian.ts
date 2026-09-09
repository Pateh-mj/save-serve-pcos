import { prisma } from "@/lib/prisma";
import { Tier, BillingStatus } from "@/lib/constants";

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
  ngoContribution: number;
  explanation: string;
}

// Standard consultation base rate in Zambian Kwacha (ZMW)
export const BASE_CONSULTATION_FEE = 150;

/**
 * Calculates billing, subsidies, and Robin Hood economic distribution
 * based on the patient's registered tier and active policies.
 */
export async function calculatePolicyBilling(
  input: PolicyCalculationInput
): Promise<PolicyCalculationResult> {
  // Determine patient tier from database if not provided
  let patientTier = input.tier ?? "FREE";
  if (!input.tier) {
    const patient = await prisma.patient.findUnique({
      where: { id: input.patientId },
      include: { user: true },
    });
    if (patient?.user?.tier) {
      patientTier = patient.user.tier;
    }
  }

  // Find active policy for this tier
  const policy = await prisma.policy.findFirst({
    where: { tier: patientTier, isActive: true },
  });

  const multiplier = policy ? policy.billingMultiplier : patientTier === "FREE" ? 0 : patientTier === "PREMIUM" ? 2.0 : 1.0;
  const baseAmount = BASE_CONSULTATION_FEE;
  const standardCost = baseAmount;
  let finalAmount = baseAmount * multiplier;
  let subsidyApplied = false;
  let subsidyAmount = 0;
  let ngoContribution = 0;
  let status: string = BillingStatus.PENDING;
  let explanation = "";

  if (patientTier === "FREE" || multiplier === 0) {
    subsidyApplied = true;
    subsidyAmount = baseAmount;
    finalAmount = 0;
    status = BillingStatus.SUBSIDIZED;
    explanation = "100% Subsidised by NGO Health Equity Pool (Robin Hood Model).";

    // Deduct subsidy from available NGO fund pool if exists
    try {
      const activeNgo = await prisma.nGO.findFirst({
        where: { fundBalance: { gte: baseAmount } },
        orderBy: { fundBalance: "desc" },
      });

      if (activeNgo) {
        await prisma.nGO.update({
          where: { id: activeNgo.id },
          data: { fundBalance: { decrement: baseAmount } },
        });
        ngoContribution = baseAmount;
      }
    } catch (e) {
      console.warn("Could not deduct from NGO fund pool:", e);
    }
  } else if (patientTier === "PREMIUM" || multiplier > 1.0) {
    status = BillingStatus.PENDING;
    const surplus = finalAmount - standardCost;
    explanation = `Premium rate includes ZMW ${surplus.toFixed(2)} direct contribution to community subsidy pool.`;

    // Add surplus to first NGO fund pool
    try {
      const activeNgo = await prisma.nGO.findFirst();
      if (activeNgo) {
        await prisma.nGO.update({
          where: { id: activeNgo.id },
          data: { fundBalance: { increment: surplus } },
        });
      }
    } catch (e) {
      console.warn("Could not credit NGO fund pool:", e);
    }
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
    ngoContribution,
    explanation,
  };
}
