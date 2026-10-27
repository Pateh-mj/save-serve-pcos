import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sessionWithRole } from "@/lib/auth";
import { Role } from "@/lib/constants";
import { sendSms } from "@/lib/sms";

const testSchema = z.object({
  to: z.string().min(9),
  message: z.string().min(1).max(320).optional(),
});

// Sends one real SMS through the configured provider so the integration can be verified.
export async function POST(req: NextRequest) {
  const session = await sessionWithRole(Role.ADMIN);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = testSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const record = await sendSms({
    to: parsed.data.to,
    purpose: "TEST",
    userId: session.user.id,
    message: parsed.data.message ?? "SaveServe test message: your SMS integration is working.",
  });
  if (!record) return NextResponse.json({ error: "Could not send or log the SMS" }, { status: 500 });
  return NextResponse.json(record);
}
