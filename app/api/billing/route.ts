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
    // An NGO only sees billings its own pool funded or received surplus from
    let where: { ngoId?: string } = {};
    if (role === Role.NGO) {
      const ngo = await prisma.nGO.findUnique({ where: { userId } });
      if (!ngo) return NextResponse.json([]);
      where = { ngoId: ngo.id };
    }

    const billings = await prisma.billing.findMany({
      where,
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
