import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/constants";
import { payBilling, PaymentMethod } from "@/lib/billing";
import { notifyLater, notifyPayment } from "@/lib/notifications";

const paySchema = z.object({
  billingId: z.string(),
  paymentMethod: z.enum(Object.values(PaymentMethod) as [string, ...string[]]).optional(),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== Role.PATIENT && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Only patients can pay bills" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = paySchema.parse(body);

    const result = await payBilling({
      billingId: data.billingId,
      actor: { role: session.user.role, userId: session.user.id },
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    if (result.alreadySettled) {
      return NextResponse.json({ message: "Bill already settled" });
    }

    notifyLater(() => notifyPayment(result.billingId));
    return NextResponse.json({
      success: true,
      message: "Payment confirmed successfully",
      amountPaid: result.amountPaid,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("Payment error:", err);
    return NextResponse.json({ error: "Failed to process payment." }, { status: 500 });
  }
}
