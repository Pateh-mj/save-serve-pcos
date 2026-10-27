import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, AppointmentStatus } from "@/lib/constants";
import { notifyLater, notifyStatusChange } from "@/lib/notifications";

const createEhrSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  diagnosis: z.string().min(2, "Diagnosis is required"),
  prescription: z.string().optional(),
  notes: z.string().optional(),
  // "YYYY-MM-DD" (clinic calendar); drives the follow-up SMS reminder
  followUpDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Follow-up date must be YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
});

/** A practitioner may only read/write records for patients they have a (non-cancelled) appointment with. */
async function hasCareRelationship(practitionerId: string, patientId: string) {
  const appt = await prisma.appointment.findFirst({
    where: { practitionerId, patientId, status: { not: AppointmentStatus.CANCELLED } },
    select: { id: true },
  });
  return appt !== null;
}

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

    let markCompleted = false;
    if (data.appointmentId) {
      const appt = await prisma.appointment.findUnique({
        where: { id: data.appointmentId },
        include: { ehrRecord: { select: { id: true } } },
      });
      if (!appt || appt.practitionerId !== practitioner.id || appt.patientId !== patient.id) {
        return NextResponse.json({ error: "Appointment not found for this practitioner and patient" }, { status: 404 });
      }
      if (appt.ehrRecord) {
        return NextResponse.json({ error: "An EHR record already exists for this appointment" }, { status: 409 });
      }
      if (appt.status !== AppointmentStatus.CONFIRMED && appt.status !== AppointmentStatus.COMPLETED) {
        return NextResponse.json(
          { error: `Cannot record a consultation for a ${appt.status} appointment` },
          { status: 409 }
        );
      }
      markCompleted = appt.status === AppointmentStatus.CONFIRMED;
    } else if (!(await hasCareRelationship(practitioner.id, patient.id))) {
      return NextResponse.json({ error: "You have no appointment with this patient" }, { status: 403 });
    }

    // Follow-up at 09:00 clinic time (UTC+2) on the chosen day; must be in the future
    const followUpDate = data.followUpDate ? new Date(`${data.followUpDate}T09:00:00+02:00`) : null;
    if (followUpDate && (isNaN(followUpDate.getTime()) || followUpDate.getTime() < Date.now())) {
      return NextResponse.json({ error: "Follow-up date must be in the future" }, { status: 400 });
    }

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.eHRRecord.create({
        data: {
          patientId: data.patientId,
          practitionerId: practitioner.id,
          appointmentId: data.appointmentId || null,
          diagnosis: data.diagnosis,
          prescription: data.prescription,
          notes: data.notes,
          followUpDate,
        },
        include: {
          practitioner: { include: { user: true } },
          patient: { include: { user: true } },
        },
      });

      // Recording the consultation completes a confirmed appointment
      if (markCompleted) {
        await tx.appointment.update({
          where: { id: data.appointmentId },
          data: { status: AppointmentStatus.COMPLETED },
        });
      }

      return created;
    });

    if (markCompleted && data.appointmentId) {
      const appointmentId = data.appointmentId;
      notifyLater(() => notifyStatusChange(appointmentId));
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
      // Full patient history is only visible to practitioners treating that patient
      if (!(await hasCareRelationship(practitioner.id, patientIdQuery))) {
        return NextResponse.json({ error: "You have no appointment with this patient" }, { status: 403 });
      }
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
