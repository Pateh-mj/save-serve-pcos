import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sessionWithRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Tier } from "@/lib/constants";
import { normalizeZambianPhone } from "@/lib/phone";

const updateSchema = z.object({
  // Patient tier classification (report assumption 2: set by administrators)
  tier: z.enum([Tier.FREE, Tier.BASIC, Tier.PREMIUM]).optional(),
  // Practitioner licence verification — unverified practitioners cannot be booked
  isVerified: z.boolean().optional(),
  phone: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await sessionWithRole(Role.ADMIN);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
  }
  const data = parsed.data;

  const user = await prisma.user.findUnique({ where: { id }, include: { practitioner: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (data.tier !== undefined && user.role !== Role.PATIENT) {
    return NextResponse.json({ error: "Only patients have a billing tier" }, { status: 400 });
  }
  if (data.isVerified !== undefined && !user.practitioner) {
    return NextResponse.json({ error: "Only practitioners can be verified" }, { status: 400 });
  }

  let phone: string | null | undefined;
  if (data.phone !== undefined) {
    phone = data.phone?.trim() ? normalizeZambianPhone(data.phone) : null;
    if (data.phone?.trim() && !phone) {
      return NextResponse.json({ error: "Enter a Zambian mobile number, e.g. 0971234567" }, { status: 400 });
    }
    if (phone) {
      const taken = await prisma.user.findFirst({ where: { phone, NOT: { id } } });
      if (taken) return NextResponse.json({ error: "That number belongs to another account" }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      tier: data.tier,
      phone,
      practitioner: data.isVerified !== undefined ? { update: { isVerified: data.isVerified } } : undefined,
    },
    include: { practitioner: true },
  });

  return NextResponse.json({
    id: updated.id,
    tier: updated.tier,
    phone: updated.phone,
    isVerified: updated.practitioner?.isVerified,
  });
}
