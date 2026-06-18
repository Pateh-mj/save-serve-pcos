import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const practitioners = await prisma.practitioner.findMany({
    where: { isVerified: true },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(practitioners);
}
