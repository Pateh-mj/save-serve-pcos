import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Users, Clock, CheckCircle2 } from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";

const STATUS_STYLE: Record<string, string> = {
  [AppointmentStatus.PENDING]:   "bg-amber-50 text-amber-700",
  [AppointmentStatus.CONFIRMED]: "bg-blue-50 text-blue-700",
  [AppointmentStatus.COMPLETED]: "bg-accent text-primary",
  [AppointmentStatus.CANCELLED]: "bg-red-50 text-red-600",
};

export default async function PractitionerDashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const practitioner = await prisma.practitioner.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      appointments: {
        orderBy: { scheduledAt: "asc" },
        include: { patient: { include: { user: true } } },
        take: 10,
      },
    },
  });

  if (!practitioner) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAppts = practitioner.appointments.filter((a) => {
    const d = new Date(a.scheduledAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const upcoming = practitioner.appointments.filter(
    (a) =>
      new Date(a.scheduledAt) >= new Date() &&
      (a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED)
  );
  const completed = practitioner.appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length;

  const stats = [
    { label: "Today's Appointments", value: todayAppts.length, icon: CalendarDays },
    { label: "Upcoming", value: upcoming.length, icon: Clock },
    { label: "Total Completed", value: completed, icon: CheckCircle2 },
    { label: "Total Patients", value: new Set(practitioner.appointments.map((a) => a.patientId)).size, icon: Users },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-foreground">
          Good morning, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {practitioner.specialty} · {practitioner.isVerified ? "Verified" : "Pending verification"}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <s.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Upcoming Appointments</h2>
        <Link href="/practitioner/schedule" className="text-sm text-primary font-medium hover:underline">
          View schedule →
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
          <p className="font-semibold text-foreground">No upcoming appointments</p>
          <p className="text-sm text-muted-foreground mt-1">Ensure your availability is up to date so patients can book.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.slice(0, 5).map((a) => (
            <div key={a.id} className="bg-white border border-border rounded-xl p-5 shadow-sm flex items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                {a.patient.user.name?.[0]?.toUpperCase() ?? "P"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{a.patient.user.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(a.scheduledAt).toLocaleDateString("en-ZM", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[a.status] ?? ""}`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
