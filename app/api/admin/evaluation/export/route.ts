import { NextRequest, NextResponse } from "next/server";
import { sessionWithRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

// Raw evaluation data as CSV for the Chapter 4 analysis: ?type=metrics|sms|feedback

function csv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v instanceof Date ? v.toISOString() : String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
  const session = await sessionWithRole(Role.ADMIN);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type") ?? "metrics";
  const since = new Date(Date.now() - 90 * 86_400_000);
  let rows: Record<string, unknown>[];

  if (type === "sms") {
    rows = await prisma.smsMessage.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, purpose: true, status: true, driver: true, segments: true, error: true },
      orderBy: { createdAt: "asc" },
    });
  } else if (type === "feedback") {
    rows = await prisma.feedback.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, rating: true, channel: true, comment: true },
      orderBy: { createdAt: "asc" },
    });
  } else {
    rows = await prisma.requestMetric.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, channel: true, action: true, durationMs: true, ok: true },
      orderBy: { createdAt: "asc" },
    });
  }

  return new NextResponse(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="saveserve-${type}.csv"`,
    },
  });
}
