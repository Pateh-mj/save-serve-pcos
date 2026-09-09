import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, BillingStatus } from "@/lib/constants";

const paySchema = z.object({
  billingId: z.string(),
  paymentMethod: z.enum(["AIRTEL_MONEY", "MTN_MOMO", "ZAMTEL_KWACHA", "CARD"]).optional(),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = paySchema.parse(body);

    const billing = await prisma.billing.findUnique({
      where: { id: data.billingId },
      include: {
        patient: true,
      },
    });

    if (!billing) {
      return NextResponse.json({ error: "Billing record not found" }, { status: 404 });
    }

    if (session.user.role === Role.PATIENT && billing.patient.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to pay this bill" }, { status: 403 });
    }

    if (billing.status === BillingStatus.PAID || billing.status === BillingStatus.SUBSIDIZED) {
      return NextResponse.json({ message: "Bill already settled", billing });
    }

    const updated = await prisma.billing.update({
      where: { id: data.billingId },
      data: {
        status: BillingStatus.PAID,
      },
      include: {
        appointment: {
          include: { practitioner: { include: { user: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment confirmed successfully",
      billing: updated,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("Payment error:", err);
    return NextResponse.json({ error: "Failed to process payment." }, { status: 500 });
  }
}
