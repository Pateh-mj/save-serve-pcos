import type { Prisma } from "@prisma/client";

export type FundTransactionType = "OPENING" | "TOPUP" | "SUBSIDY_DEBIT" | "SUBSIDY_REFUND" | "PREMIUM_CREDIT";

interface FundMovement {
  ngoId: string;
  type: FundTransactionType;
  /** Signed: positive credits the pool, negative debits it. */
  amount: number;
  billingId?: string;
  note?: string;
}

/**
 * The only way pool money moves: updates NGO.fundBalance and writes the matching
 * FundTransaction in the caller's transaction, so the ledger always reconciles.
 * A debit only applies if the pool still covers it; returns false otherwise.
 */
export async function moveFunds(tx: Prisma.TransactionClient, m: FundMovement) {
  if (m.amount < 0) {
    const { count } = await tx.nGO.updateMany({
      where: { id: m.ngoId, fundBalance: { gte: -m.amount } },
      data: { fundBalance: { increment: m.amount } },
    });
    if (count === 0) return false;
  } else {
    await tx.nGO.update({ where: { id: m.ngoId }, data: { fundBalance: { increment: m.amount } } });
  }

  await tx.fundTransaction.create({
    data: { ngoId: m.ngoId, type: m.type, amount: m.amount, billingId: m.billingId, note: m.note },
  });
  return true;
}
