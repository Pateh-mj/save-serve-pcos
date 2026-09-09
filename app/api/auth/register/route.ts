import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([Role.PATIENT, Role.PRACTITIONER, Role.NGO, Role.ADMIN]),
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
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    if (data.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone.trim() } });
      if (existingPhone) {
        return NextResponse.json({ error: "Phone number already registered." }, { status: 409 });
      }
    }

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        phone: data.phone ? data.phone.trim() : null,
        password: hashed,
        role: data.role,
        tier: data.role === Role.NGO ? "PREMIUM" : "FREE",
        patient:
          data.role === Role.PATIENT ? { create: {} } : undefined,
        practitioner:
          data.role === Role.PRACTITIONER
            ? {
                create: {
                  specialty: data.specialty ?? "NURSE",
                  licenseNo: data.licenseNo?.trim() || `LIC-${Date.now()}`,
                  location: data.location?.trim() || "Lusaka, Zambia",
                  isVerified: true,
                },
              }
            : undefined,
        ngo:
          data.role === Role.NGO
            ? { create: { name: data.orgName?.trim() || data.name.trim(), fundBalance: 5000 } }
            : undefined,
      },
      include: {
        patient: true,
        practitioner: true,
        ngo: true,
      },
    });

    return NextResponse.json({ id: user.id, role: user.role, email: user.email }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Something went wrong during registration." }, { status: 500 });
  }
}
