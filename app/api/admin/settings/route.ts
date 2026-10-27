import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sessionWithRole } from "@/lib/auth";
import { Role } from "@/lib/constants";
import { getConsultationFee, setConsultationFee } from "@/lib/settings";

const settingsSchema = z.object({
  consultationFee: z.number().positive().max(100_000),
});

export async function GET() {
  const session = await sessionWithRole(Role.ADMIN);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ consultationFee: await getConsultationFee() });
}

export async function PUT(req: NextRequest) {
  const session = await sessionWithRole(Role.ADMIN);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 });
  }
  await setConsultationFee(parsed.data.consultationFee);
  return NextResponse.json({ consultationFee: parsed.data.consultationFee });
}
