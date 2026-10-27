import { NextRequest, NextResponse } from "next/server";
import { sessionWithRole } from "@/lib/auth";
import { Role } from "@/lib/constants";
import { getEvaluationReport } from "@/lib/evaluation";

// The evaluation report as JSON (same data as /admin/evaluation), e.g. for scripts and Chapter 4 tables.
export async function GET(req: NextRequest) {
  const session = await sessionWithRole(Role.ADMIN);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get("days") ?? 30) || 30));
  return NextResponse.json(await getEvaluationReport(days));
}
