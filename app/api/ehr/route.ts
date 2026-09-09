import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, AppointmentStatus } from "@/lib/constants";

const createEhrSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  diagnosis: z.string().min(2, "Diagnosis is required"),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce Practitioner-only authorization on write
  if (session.user.role !== Role.PRACTITIONER) {
    return NextResponse.json({ error: "Only licensed medical practitioners can author EHR records" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createEhrSchema.parse(body);

    const practitioner = await prisma.practitioner.findUnique({
      where: { userId: session.user.id },
    });
    if (!practitioner) {
      return NextResponse.json({ error: "Practitioner profile not found" }, { status: 404 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const record = await prisma.eHRRecord.create({
      data: {
        patientId: data.patientId,
        practitionerId: practitioner.id,
        appointmentId: data.appointmentId || null,
        diagnosis: data.diagnosis,
        prescription: data.prescription,
        notes: data.notes,
      },
      include: {
        practitioner: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    // If linked to an appointment, mark it completed
    if (data.appointmentId) {
      await prisma.appointment.update({
        where: { id: data.appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      }).catch((e) => console.warn("Could not mark appointment completed:", e));
    }

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("EHR creation error:", err);
    return NextResponse.json({ error: "Failed to create EHR record." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId } = session.user;
  const { searchParams } = new URL(req.url);
  const patientIdQuery = searchParams.get("patientId");

  if (role === Role.PATIENT) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return NextResponse.json([]);

    const records = await prisma.eHRRecord.findMany({
      where: { patientId: patient.id },
      include: {
        practitioner: { include: { user: true } },
        appointment: true,
      },
      orderBy: { visitDate: "desc" },
    });
    return NextResponse.json(records);
  }

  if (role === Role.PRACTITIONER) {
    const practitioner = await prisma.practitioner.findUnique({ where: { userId } });
    if (!practitioner) return NextResponse.json([]);

    const whereClause: { practitionerId?: string; patientId?: string } = {};
    if (patientIdQuery) {
      whereClause.patientId = patientIdQuery;
    } else {
      whereClause.practitionerId = practitioner.id;
    }

    const records = await prisma.eHRRecord.findMany({
      where: whereClause,
      include: {
        patient: { include: { user: true } },
        practitioner: { include: { user: true } },
        appointment: true,
      },
      orderBy: { visitDate: "desc" },
    });
    return NextResponse.json(records);
  }

  if (role === Role.ADMIN) {
    const records = await prisma.eHRRecord.findMany({
      include: {
        patient: { include: { user: true } },
        practitioner: { include: { user: true } },
        appointment: true,
      },
      orderBy: { visitDate: "desc" },
      take: 100,
    });
    return NextResponse.json(records);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
