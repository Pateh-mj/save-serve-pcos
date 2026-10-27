import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, AppointmentStatus, Channel } from "@/lib/constants";
import { bookAppointment } from "@/lib/booking";
import { transitionAppointment } from "@/lib/appointments";
import { notifyBooked, notifyLater, notifyStatusChange } from "@/lib/notifications";
import { recordMetric } from "@/lib/metrics";

const createSchema = z.object({
  practitionerId: z.string(),
  scheduledAt: z.string(),
  notes: z.string().max(1000).optional(),
  // Symptom triage (lib/triage.ts) — the level is computed server-side, never trusted from the client
  symptoms: z.array(z.string()).max(20).default([]),
  durationDays: z.number().int().min(0).max(365).optional(),
  severity: z.number().int().min(1).max(3).optional(),
});

const updateSchema = z.object({
  appointmentId: z.string(),
  status: z.enum([
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
  ]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== Role.PATIENT) {
    return NextResponse.json({ error: "Only patients can book appointments" }, { status: 403 });
  }

  const started = Date.now();
  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });
    if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

    const practitioner = await prisma.practitioner.findUnique({
      where: { id: data.practitionerId },
    });
    if (!practitioner) return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });

    if (!practitioner.isVerified) {
      return NextResponse.json({ error: "This practitioner is not yet verified" }, { status: 409 });
    }

    // Slot check, triage, Policy Guardian billing and NGO pool debit happen together
    const result = await bookAppointment({
      patientId: patient.id,
      practitionerId: practitioner.id,
      scheduledAt: new Date(data.scheduledAt),
      channel: Channel.WEB,
      notes: data.notes,
      triage: { symptoms: data.symptoms, durationDays: data.durationDays, severity: data.severity },
    });
    notifyLater(() => recordMetric("WEB", "booking.create", Date.now() - started, result.ok));

    if (!result.ok) {
      return NextResponse.json(
        { error: "That slot is no longer available. Please choose another time." },
        { status: 409 }
      );
    }

    notifyLater(() => notifyBooked(result.appointment.id));
    return NextResponse.json(
      { ...result.appointment, billingExplanation: result.explanation, triage: result.triage },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("Error creating appointment:", err);
    return NextResponse.json({ error: "Failed to create appointment." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  if (role === Role.PATIENT) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return NextResponse.json([]);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        practitioner: { include: { user: true } },
        billing: true,
        ehrRecord: true,
      },
      orderBy: { scheduledAt: "desc" },
    });
    return NextResponse.json(appointments);
  }

  if (role === Role.PRACTITIONER) {
    const practitioner = await prisma.practitioner.findUnique({ where: { userId } });
    if (!practitioner) return NextResponse.json([]);

    const appointments = await prisma.appointment.findMany({
      where: { practitionerId: practitioner.id },
      include: {
        patient: { include: { user: true } },
        billing: true,
        ehrRecord: true,
      },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(appointments);
  }

  if (role === Role.ADMIN) {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: { include: { user: true } },
        practitioner: { include: { user: true } },
        billing: true,
      },
      orderBy: { scheduledAt: "desc" },
      take: 50,
    });
    return NextResponse.json(appointments);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const result = await transitionAppointment({
      appointmentId: data.appointmentId,
      to: data.status,
      actor: { role: session.user.role, userId: session.user.id },
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    notifyLater(() => notifyStatusChange(result.appointment.id));
    return NextResponse.json(result.appointment);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("Error updating appointment:", err);
    return NextResponse.json({ error: "Failed to update appointment." }, { status: 500 });
  }
}
