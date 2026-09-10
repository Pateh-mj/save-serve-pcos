import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // "YYYY-MM-DD"
    if (!dateParam) return NextResponse.json({ error: "date query param required" }, { status: 400 });

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

    const slots = await getAvailableSlots(id, date);
    return NextResponse.json({
        slots: slots.map((s) => ({
            iso: s.toISOString(),
            label: s.toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit" }),
        })),
    });
}