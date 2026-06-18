import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Plus, Clock } from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";

const STATUS_STYLE: Record<string, string> = {
  [AppointmentStatus.PENDING]:   "bg-amber-50 text-amber-700 border border-amber-200",
  [AppointmentStatus.CONFIRMED]: "bg-blue-50 text-blue-700 border border-blue-200",
  [AppointmentStatus.COMPLETED]: "bg-accent text-primary border border-primary/20",
  [AppointmentStatus.CANCELLED]: "bg-red-50 text-red-600 border border-red-200",
};

export default async function AppointmentsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const patient = await prisma.patient.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      appointments: {
        orderBy: { scheduledAt: "desc" },
        include: { practitioner: { include: { user: true } } },
      },
    },
  });

  if (!patient) redirect("/login");

  const appointments = patient.appointments;
  const upcoming = appointments.filter(
    (a) =>
      (a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED) &&
      new Date(a.scheduledAt) >= new Date()
  );
  const past = appointments.filter((a) => !upcoming.includes(a));

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track all your healthcare appointments</p>
        </div>
        <Link
          href="/patient/appointments/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Book Appointment
        </Link>
      </div>

      {upcoming.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="bg-white border border-border rounded-xl p-5 shadow-sm flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <CalendarDays className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{a.practitioner.user.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(a.scheduledAt).toLocaleDateString("en-ZM", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {a.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{a.notes}</p>}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[a.status] ?? ""}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Past</h2>
          <div className="space-y-3">
            {past.map((a) => (
              <div key={a.id} className="bg-white border border-border rounded-xl p-5 flex items-center gap-5 opacity-75">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <CalendarDays className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{a.practitioner.user.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(a.scheduledAt).toLocaleDateString("en-ZM", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[a.status] ?? ""}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {appointments.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
          <p className="font-semibold text-foreground">No appointments yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Book your first appointment with a verified practitioner.</p>
          <Link href="/patient/appointments/new" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90">
            Book Now
          </Link>
        </div>
      )}
    </div>
  );
}
