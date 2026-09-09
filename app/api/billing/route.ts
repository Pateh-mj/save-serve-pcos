import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, id: userId } = session.user;

  if (role === Role.PATIENT) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return NextResponse.json([]);

    const billings = await prisma.billing.findMany({
      where: { patientId: patient.id },
      include: {
        appointment: {
          include: {
            practitioner: { include: { user: true } },
          },
        },
        policy: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(billings);
  }

  if (role === Role.ADMIN || role === Role.NGO) {
    const billings = await prisma.billing.findMany({
      include: {
        patient: { include: { user: true } },
        appointment: {
          include: {
            practitioner: { include: { user: true } },
          },
        },
        policy: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(billings);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
