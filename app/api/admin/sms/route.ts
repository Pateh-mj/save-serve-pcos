import { NextRequest, NextResponse } from "next/server";
import { sessionWithRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";
import { normalizeZambianPhone } from "@/lib/phone";
import { smsConfig } from "@/lib/sms";

// SMS configuration status and recent messages (optionally for one number: ?to=0971234567).
export async function GET(req: NextRequest) {
  const session = await sessionWithRole(Role.ADMIN);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const toParam = req.nextUrl.searchParams.get("to");
  const to = toParam ? normalizeZambianPhone(toParam) : null;
  if (toParam && !to) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });

  const config = smsConfig();
  const messages = await prisma.smsMessage.findMany({
    where: to ? { to } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, to: true, purpose: true, status: true, driver: true, segments: true, error: true, body: true, createdAt: true },
  });

  return NextResponse.json({
    config: { driver: config.driver, senderId: config.senderId, allowlistSize: config.allowlist.length, dailyLimit: config.dailyLimit },
    messages,
  });
}
