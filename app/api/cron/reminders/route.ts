import { NextRequest, NextResponse } from "next/server";
import { runReminderJob } from "@/lib/notifications";

// Vercel Cron (vercel.json) calls this daily with "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runReminderJob();
  return NextResponse.json({ ok: true, ...result });
}
