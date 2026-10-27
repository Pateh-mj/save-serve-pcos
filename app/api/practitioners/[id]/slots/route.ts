import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { formatTime } from "@/lib/format";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // "YYYY-MM-DD" in clinic time
    if (!dateParam) return NextResponse.json({ error: "date query param required" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return NextResponse.json({ error: "Invalid date, expected YYYY-MM-DD" }, { status: 400 });
    }

    const slots = await getAvailableSlots(id, dateParam);
    return NextResponse.json({
        slots: slots.map((s) => ({
            iso: s.toISOString(),
            label: formatTime(s),
        })),
    });
}
