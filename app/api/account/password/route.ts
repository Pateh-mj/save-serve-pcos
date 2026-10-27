import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = passwordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) {
    return NextResponse.json({ error: "This account signs in by USSD and has no web password" }, { status: 400 });
  }
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(parsed.data.newPassword, 12) },
  });
  return NextResponse.json({ ok: true });
}
