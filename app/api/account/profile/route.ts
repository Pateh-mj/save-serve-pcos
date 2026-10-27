import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";
import { normalizeZambianPhone } from "@/lib/phone";

const optionalText = (max: number) => z.string().trim().max(max).optional();

// One schema for every role; only the fields that belong to the caller's role are applied.
const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
  phone: z.string().nullable().optional(),
  // Patient
  nrc: optionalText(20),
  dateOfBirth: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Date of birth must be YYYY-MM-DD").optional(),
  address: optionalText(200),
  emergencyContact: optionalText(120),
  // Practitioner
  location: optionalText(120),
  bio: optionalText(600),
  // NGO
  orgName: z.string().trim().min(2, "Organisation name must be at least 2 characters").max(120).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = profileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile" }, { status: 400 });
  }
  const data = parsed.data;
  const { id: userId, role } = session.user;

  let phone: string | null | undefined;
  if (data.phone !== undefined) {
    phone = data.phone?.trim() ? normalizeZambianPhone(data.phone) : null;
    if (data.phone?.trim() && !phone) {
      return NextResponse.json({ error: "Enter a Zambian mobile number, e.g. 0971234567" }, { status: 400 });
    }
    if (phone) {
      const taken = await prisma.user.findFirst({ where: { phone, NOT: { id: userId } } });
      if (taken) return NextResponse.json({ error: "That number belongs to another account" }, { status: 409 });
    }
  }

  let dateOfBirth: Date | null | undefined;
  if (data.dateOfBirth !== undefined) {
    dateOfBirth = data.dateOfBirth ? new Date(`${data.dateOfBirth}T00:00:00+02:00`) : null;
    if (dateOfBirth && (isNaN(dateOfBirth.getTime()) || dateOfBirth.getTime() > Date.now())) {
      return NextResponse.json({ error: "Date of birth must be in the past" }, { status: 400 });
    }
  }

  const blank = (v: string | undefined) => (v === undefined ? undefined : v || null);

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      phone,
      patient:
        role === Role.PATIENT
          ? {
              update: {
                nrc: blank(data.nrc),
                dateOfBirth,
                address: blank(data.address),
                emergencyContact: blank(data.emergencyContact),
              },
            }
          : undefined,
      practitioner:
        role === Role.PRACTITIONER
          ? { update: { location: blank(data.location), bio: blank(data.bio) } }
          : undefined,
      ngo: role === Role.NGO && data.orgName ? { update: { name: data.orgName } } : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
