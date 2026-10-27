import { NextRequest, NextResponse } from "next/server";
import { sessionWithRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";
import { calculatePolicyBilling } from "@/lib/policy-guardian";

// Read-only Policy Guardian preview: what this patient would pay, before booking.
export async function GET(req: NextRequest) {
  const session = await sessionWithRole(Role.PATIENT);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const practitionerId = req.nextUrl.searchParams.get("practitionerId");
  if (!practitionerId) return NextResponse.json({ error: "practitionerId is required" }, { status: 400 });

  const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
  if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

  const quote = await calculatePolicyBilling({ patientId: patient.id, practitionerId });
  return NextResponse.json({
    tier: quote.tier,
    baseAmount: quote.baseAmount,
    finalAmount: quote.finalAmount,
    status: quote.status,
    explanation: quote.explanation,
  });
}
