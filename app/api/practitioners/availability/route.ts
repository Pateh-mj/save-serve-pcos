import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";
import { NextResponse } from "next/server";
import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Times must be HH:MM");

const availabilitySchema = z.object({
    days: z
        .array(
            z
                .object({
                    dayOfWeek: z.number().int().min(0).max(6),
                    startTime: time,
                    endTime: time,
                    isActive: z.boolean(),
                })
                .refine((d) => !d.isActive || d.startTime < d.endTime, "Start time must be before end time")
        )
        .length(7, "Expected 7 days")
        .refine((days) => new Set(days.map((d) => d.dayOfWeek)).size === 7, "Each day must appear once"),
});

async function getPractitionerOrNull() {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.PRACTITIONER) return null;
    return prisma.practitioner.findUnique({
        where: { userId: session.user.id },
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

    const parsed = availabilitySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid availability" }, { status: 400 });
    }
    const { days } = parsed.data;

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
