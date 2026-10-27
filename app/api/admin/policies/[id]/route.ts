import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sessionWithRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

const updateSchema = z.object({
  billingMultiplier: z.number().min(0).max(10).optional(),
  // null removes the limit
  maxVisitsPerMonth: z.number().int().min(0).max(31).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await sessionWithRole(Role.ADMIN);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid policy update" }, { status: 400 });
  }
  const data = parsed.data;

  const policy = await prisma.policy.findUnique({ where: { id } });
  if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

  let rules: Record<string, unknown> = {};
  try {
    rules = JSON.parse(policy.rules) ?? {};
  } catch {
    rules = {};
  }
  if (data.maxVisitsPerMonth !== undefined) {
    if (data.maxVisitsPerMonth === null) delete rules.maxVisitsPerMonth;
    else rules.maxVisitsPerMonth = data.maxVisitsPerMonth;
  }

  // The Policy Guardian uses the single active policy per tier
  if (data.isActive === true) {
    const otherActive = await prisma.policy.findFirst({ where: { tier: policy.tier, isActive: true, NOT: { id } } });
    if (otherActive) {
      return NextResponse.json({ error: `Another ${policy.tier} policy is already active` }, { status: 409 });
    }
  }

  const updated = await prisma.policy.update({
    where: { id },
    data: {
      billingMultiplier: data.billingMultiplier,
      isActive: data.isActive,
      rules: JSON.stringify(rules),
    },
  });
  return NextResponse.json(updated);
}
