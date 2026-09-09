import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

const topupSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
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

  const subsidizedBillings = await prisma.billing.findMany({
    where: { subsidyApplied: true },
    include: {
      patient: { include: { user: true } },
      appointment: { include: { practitioner: { include: { user: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const totalSubsidizedCount = await prisma.billing.count({
    where: { subsidyApplied: true },
  });

  const totalSubsidizedAmount = await prisma.billing.aggregate({
    where: { subsidyApplied: true },
    _sum: { amount: true },
  });

  return NextResponse.json({
    ngo,
    metrics: {
      fundBalance: ngo?.fundBalance ?? 0,
      totalSubsidizedVisits: totalSubsidizedCount,
      totalSubsidizedValueZMW: totalSubsidizedAmount._sum.amount ?? 0,
    },
    recentSubsidizedPatients: subsidizedBillings,
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

    const updated = await prisma.nGO.update({
      where: { id: ngo.id },
      data: {
        fundBalance: { increment: data.amount },
      },
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
