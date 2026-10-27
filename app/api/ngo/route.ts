import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";
import { getNgoSubsidyStats } from "@/lib/ngo";
import { moveFunds } from "@/lib/ledger";

const topupSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero").max(1_000_000, "Maximum top-up is ZMW 1,000,000"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== Role.NGO && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ngo = await prisma.nGO.findFirst({
    where: session.user.role === Role.NGO ? { userId: session.user.id } : undefined,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!ngo) {
    return NextResponse.json({ error: "NGO profile not found" }, { status: 404 });
  }

  const stats = await getNgoSubsidyStats(ngo.id, 20);

  return NextResponse.json({
    ngo,
    metrics: {
      fundBalance: ngo.fundBalance,
      totalSubsidizedVisits: stats.subsidizedVisits,
      totalSubsidizedValueZMW: stats.subsidizedValue,
      premiumContributions: stats.premiumContributions,
      premiumContributionValueZMW: stats.premiumContributionValue,
    },
    recentSubsidizedPatients: stats.recentSubsidized,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== Role.NGO && session.user.role !== Role.ADMIN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = topupSchema.parse(body);

    const ngo = await prisma.nGO.findFirst({
      where: session.user.role === Role.NGO ? { userId: session.user.id } : undefined,
    });

    if (!ngo) {
      return NextResponse.json({ error: "NGO profile not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await moveFunds(tx, { ngoId: ngo.id, type: "TOPUP", amount: data.amount, note: "Pool top-up" });
      return tx.nGO.findUniqueOrThrow({ where: { id: ngo.id } });
    });

    return NextResponse.json({
      success: true,
      message: `Successfully credited ZMW ${data.amount.toFixed(2)} to subsidy pool.`,
      ngo: updated,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("NGO topup error:", err);
    return NextResponse.json({ error: "Failed to top up fund pool." }, { status: 500 });
  }
}
