import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CalendarClock, Phone } from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";
import AvailabilityEditor from "./AvailabilityEditor";
import { clinicDateKey, formatDate, formatTime } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata = { title: "Schedule" };

export default async function SchedulePage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    const practitioner = await prisma.practitioner.findFirst({
        where: { user: { email: session.user.email } },
        include: {
            appointments: {
                where: { status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] } },
                orderBy: { scheduledAt: "asc" },
                include: { patient: { include: { user: true } } },
            },
            availability: true,
        },
    });

    if (!practitioner) redirect("/login");

    // Group upcoming appointments by day
    const grouped = new Map<string, typeof practitioner.appointments>();
    for (const a of practitioner.appointments) {
        const key = clinicDateKey(a.scheduledAt);
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(a);
    }

    const initialAvailability = Array.from({ length: 7 }, (_, dayOfWeek) => {
        const existing = practitioner.availability.find((av) => av.dayOfWeek === dayOfWeek);
        return {
            dayOfWeek,
            startTime: existing?.startTime ?? "09:00",
            endTime: existing?.endTime ?? "17:00",
            isActive: existing?.isActive ?? false,
        };
    });

    return (
        <div className="max-w-6xl">
            <PageHeader title="Schedule" description="Manage your weekly availability and view upcoming appointments" />

            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
                <AvailabilityEditor initial={initialAvailability} />

                <div>
                    <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-primary" /> Upcoming Agenda
                    </h2>

                    {grouped.size === 0 ? (
                        <div className="bg-card border border-border rounded-xl p-8 text-center">
                            <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Array.from(grouped.entries()).map(([day, appts]) => (
                                <div key={day}>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                        {formatDate(appts[0].scheduledAt, { weekday: "long", month: "short", day: "numeric" })}
                                    </p>
                                    <div className="space-y-2">
                                        {appts.map((a) => (
                                            <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm">{a.patient.user.name}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                        {formatTime(a.scheduledAt)}
                                                        {a.patient.user.phone && (
                                                            <span className="inline-flex items-center gap-1 text-primary">
                                                                <Phone className="w-3 h-3" /> {a.patient.user.phone}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${a.status === AppointmentStatus.CONFIRMED
                                                        ? "bg-info-soft text-info-fg border border-info-border"
                                                        : "bg-warning-soft text-warning-fg border border-warning-border"
                                                    }`}>
                                                    {a.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}