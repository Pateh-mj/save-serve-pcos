import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getPractitionerOrNull() {
    const session = await auth();
    if (!session?.user?.email) return null;
    return prisma.practitioner.findFirst({
        where: { user: { email: session.user.email } },
    });
}

export async function GET() {
    const practitioner = await getPractitionerOrNull();
    if (!practitioner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const availability = await prisma.availability.findMany({
        where: { practitionerId: practitioner.id },
        orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ availability });
}

export async function POST(req: Request) {
    const practitioner = await getPractitionerOrNull();
    if (!practitioner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const days: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[] = body.days;

    if (!Array.isArray(days) || days.length !== 7) {
        return NextResponse.json({ error: "Expected 7 days" }, { status: 400 });
    }

    await prisma.$transaction(
        days.map((d) =>
            prisma.availability.upsert({
                where: { practitionerId_dayOfWeek: { practitionerId: practitioner.id, dayOfWeek: d.dayOfWeek } },
                update: { startTime: d.startTime, endTime: d.endTime, isActive: d.isActive },
                create: {
                    practitionerId: practitioner.id,
                    dayOfWeek: d.dayOfWeek,
                    startTime: d.startTime,
                    endTime: d.endTime,
                    isActive: d.isActive,
                },
            })
        )
    );

    return NextResponse.json({ success: true });
}