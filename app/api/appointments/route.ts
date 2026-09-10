import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, AppointmentStatus, Channel } from "@/lib/constants";
import { calculatePolicyBilling } from "@/lib/policy-guardian";
import { isSlotAvailable } from "@/lib/availability";

const createSchema = z.object({
  practitionerId: z.string(),
  scheduledAt: z.string(),
  notes: z.string().optional(),
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

    // Calculate billing & subsidies via Policy Guardian
    const policyCalc = await calculatePolicyBilling({
      patientId: patient.id,
      practitionerId: practitioner.id,
      tier: session.user.tier,
    });

    const available = await isSlotAvailable(practitionerId, new Date(scheduledAt));
    if (!available) {
      return NextResponse.json(
        { error: "That slot is no longer available. Please choose another time." },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        practitionerId: data.practitionerId,
        scheduledAt: new Date(data.scheduledAt),
        status: AppointmentStatus.PENDING,
        channel: Channel.WEB,
        notes: data.notes,
        billing: {
          create: {
            patientId: patient.id,
            amount: policyCalc.baseAmount,
            discountedAmount: policyCalc.finalAmount,
            tier: policyCalc.tier,
            subsidyApplied: policyCalc.subsidyApplied,
            subsidyAmount: policyCalc.subsidyAmount > 0 ? policyCalc.subsidyAmount : null,
            status: policyCalc.status,
            policyId: policyCalc.policyId,
          },
        },
      },
      include: {
        billing: true,
        practitioner: { include: { user: true } },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
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

  if (role === Role.ADMIN || role === Role.NGO) {
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

    const appt = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: { practitioner: true, patient: true },
    });

    if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    // Verify user is authorized to modify this appointment
    const isOwnerPatient = session.user.role === Role.PATIENT && appt.patient.userId === session.user.id;
    const isOwnerPractitioner = session.user.role === Role.PRACTITIONER && appt.practitioner.userId === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;

    if (!isOwnerPatient && !isOwnerPractitioner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: { status: data.status },
      include: {
        billing: true,
        practitioner: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("Error updating appointment:", err);
    return NextResponse.json({ error: "Failed to update appointment." }, { status: 500 });
  }
}
