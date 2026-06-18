import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9).optional(),
  password: z.string().min(6),
  role: z.enum([Role.PATIENT, Role.PRACTITIONER, Role.NGO]),
  // Practitioner extras
  specialty: z.string().optional(),
  licenseNo: z.string().optional(),
  location: z.string().optional(),
  // NGO extras
  orgName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashed,
        role: data.role,
        tier: "FREE",
        // Create the role-specific profile in the same transaction
        patient:
          data.role === Role.PATIENT ? { create: {} } : undefined,
        practitioner:
          data.role === Role.PRACTITIONER
            ? {
                create: {
                  specialty: data.specialty ?? "NURSE",
                  licenseNo: data.licenseNo ?? `LIC-${Date.now()}`,
                  location: data.location,
                },
              }
            : undefined,
        ngo:
          data.role === Role.NGO
            ? { create: { name: data.orgName ?? data.name } }
            : undefined,
      },
    });

    return NextResponse.json({ id: user.id, role: user.role }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
