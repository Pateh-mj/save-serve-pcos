import { prisma } from "@/lib/prisma";
import { BillingStatus } from "@/lib/constants";

export const LEDGER_LABEL: Record<string, string> = {
  OPENING: "Opening balance",
  TOPUP: "Top-up",
  SUBSIDY_DEBIT: "Subsidised visit",
  SUBSIDY_REFUND: "Subsidy returned (visit cancelled)",
  PREMIUM_CREDIT: "Premium surplus (Robin Hood)",
};

/** Funding partners see abbreviated identities only: "Mwila Chanda" → "M. Chanda". */
export function abbreviateName(name: string | null | undefined) {
  const parts = (name ?? "").replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Anonymous";
  if (parts.length === 1) return `${parts[0][0]}.`;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

/** Subsidised visits funded by, and premium surplus paid into, one NGO's pool. */
export async function getNgoSubsidyStats(ngoId: string, recentLimit = 10) {
  const subsidizedWhere = { ngoId, status: BillingStatus.SUBSIDIZED };
  const contributionWhere = { ngoId, status: BillingStatus.PAID };

  const [recentSubsidized, subsidizedAgg, contributionAgg, recentTransactions, ledgerAgg] = await Promise.all([
    prisma.billing.findMany({
      where: subsidizedWhere,
      include: {
        patient: { include: { user: { select: { name: true } } } },
        appointment: { include: { practitioner: { include: { user: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: recentLimit,
    }),
    prisma.billing.aggregate({
      where: subsidizedWhere,
      _count: true,
      _sum: { subsidyAmount: true },
    }),
    prisma.billing.aggregate({
      where: contributionWhere,
      _count: true,
      _sum: { amount: true, discountedAmount: true },
    }),
    prisma.fundTransaction.findMany({
      where: { ngoId },
      orderBy: { createdAt: "desc" },
      take: recentLimit,
    }),
    prisma.fundTransaction.aggregate({ where: { ngoId }, _sum: { amount: true } }),
  ]);

  return {
    recentSubsidized,
    recentTransactions,
    /** Sum of the ledger — equals fundBalance when every movement went through lib/ledger.ts */
    ledgerBalance: ledgerAgg._sum.amount ?? 0,
    subsidizedVisits: subsidizedAgg._count,
    subsidizedValue: subsidizedAgg._sum.subsidyAmount ?? 0,
    premiumContributions: contributionAgg._count,
    premiumContributionValue:
      (contributionAgg._sum.discountedAmount ?? 0) - (contributionAgg._sum.amount ?? 0),
  };
}
