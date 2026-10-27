import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sessionWithRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";
import { submitFeedback } from "@/lib/feedback";

const feedbackSchema = z.object({
  appointmentId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await sessionWithRole(Role.PATIENT);
  if (!session) return NextResponse.json({ error: "Only patients can rate visits" }, { status: 403 });

  const parsed = feedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid feedback" }, { status: 400 });
  }

  const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
  if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

  const result = await submitFeedback({ ...parsed.data, patientId: patient.id, channel: "WEB" });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json(result.feedback, { status: 201 });
}
