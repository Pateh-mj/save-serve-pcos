import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

const schema = z.object({
  practitionerId: z.string(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
});

// Billing multipliers per tier (Policy Guardian)
const TIER_RATE: Record<string, number> = {
  FREE:    0,    // fully subsidised
  BASIC:   150,  // ZMW 150 base
  PREMIUM: 300,  // ZMW 300 base
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== Role.PATIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });
    if (!patient) return NextResponse.json({ error: "Patient record not found" }, { status: 404 });

    const practitioner = await prisma.practitioner.findUnique({
      where: { id: data.practitionerId },
    });
    if (!practitioner) return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });

    // Find active policy for this tier
    const policy = await prisma.policy.findFirst({
      where: { tier: session.user.tier, isActive: true },
    });

    const baseAmount = TIER_RATE[session.user.tier] ?? 150;
    const multiplier = policy?.billingMultiplier ?? 1.0;
    const finalAmount = baseAmount * multiplier;
    const isSubsidised = session.user.tier === "FREE";

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        practitionerId: data.practitionerId,
        scheduledAt: new Date(data.scheduledAt),
        status: "PENDING",
        channel: "WEB",
        notes: data.notes,
        billing: {
          create: {
            patientId: patient.id,
            amount: finalAmount,
            tier: session.user.tier,
            subsidyApplied: isSubsidised,
            subsidyAmount: isSubsidised ? finalAmount : null,
            status: isSubsidised ? "SUBSIDIZED" : "PENDING",
            policyId: policy?.id,
          },
        },
      },
      include: { billing: true },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
  if (!patient) return NextResponse.json([]);

  const appointments = await prisma.appointment.findMany({
    where: { patientId: patient.id },
    include: { practitioner: { include: { user: true } }, billing: true },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json(appointments);
}
