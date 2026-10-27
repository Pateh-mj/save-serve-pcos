import { NextResponse } from "next/server";
import { sessionWithRole } from "@/lib/auth";
import { Role } from "@/lib/constants";
import { runReminderJob } from "@/lib/notifications";

// Manual trigger for the daily reminder job (same job the cron runs).
export async function POST() {
  const session = await sessionWithRole(Role.ADMIN);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await runReminderJob();
  return NextResponse.json({ ok: true, ...result });
}
