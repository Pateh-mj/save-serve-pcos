import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";
import { normalizeZambianPhone } from "@/lib/phone";
import { notifyLater, notifyWelcome } from "@/lib/notifications";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // ADMIN accounts are provisioned via the seed, never self-registered
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
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    // Store one canonical format so USSD lookups and SMS delivery match
    const phone = data.phone?.trim() ? normalizeZambianPhone(data.phone) : null;
    if (data.phone?.trim() && !phone) {
      return NextResponse.json({ error: "Enter a Zambian mobile number, e.g. 0971234567." }, { status: 400 });
    }
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json({ error: "Phone number already registered." }, { status: 409 });
      }
    }

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        phone,
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
                  isVerified: false, // an admin verifies the licence before patients can book
                },
              }
            : undefined,
        ngo:
          data.role === Role.NGO
            ? { create: { name: data.orgName?.trim() || data.name.trim(), fundBalance: 0 } } // funded via top-up
            : undefined,
      },
      include: {
        patient: true,
        practitioner: true,
        ngo: true,
      },
    });

    if (user.role === Role.PATIENT) notifyLater(() => notifyWelcome(user.id));
    return NextResponse.json({ id: user.id, role: user.role, email: user.email }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Something went wrong during registration." }, { status: 500 });
  }
}
