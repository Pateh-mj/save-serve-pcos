import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  CreditCard,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING:   { label: "Pending",   cls: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  CONFIRMED: { label: "Confirmed", cls: "bg-blue-50 text-blue-700 border-blue-200",       icon: CheckCircle2 },
  COMPLETED: { label: "Completed", cls: "bg-green-50 text-green-700 border-green-200",    icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", cls: "bg-red-50 text-red-700 border-red-200",          icon: AlertCircle },
};

export default async function PatientDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: {
      appointments: {
        orderBy: { scheduledAt: "desc" },
        take: 5,
        include: { practitioner: { include: { user: true } } },
      },
      ehrRecords: { orderBy: { visitDate: "desc" }, take: 1 },
      billings: { where: { status: "PENDING" } },
    },
  });

  if (!patient) redirect("/login");

  const upcoming = patient.appointments.filter(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED"
  );
  const totalVisits = patient.appointments.filter((a) => a.status === "COMPLETED").length;
  const pendingBills = patient.billings.length;

  const stats = [
    { label: "Upcoming", value: upcoming.length, icon: CalendarDays, href: "/patient/appointments", color: "text-primary" },
    { label: "Total Visits", value: totalVisits,  icon: FileText,     href: "/patient/records",      color: "text-brand-emerald" },
    { label: "Pending Bills", value: pendingBills, icon: CreditCard,  href: "/patient/billing",      color: "text-yellow-600" },
  ];

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground">
          {greeting}, {firstName} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s a summary of your healthcare activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              <s.icon className={`w-5 h-5 ${s.color}`} strokeWidth={1.5} />
            </div>
            <p className="text-4xl font-extrabold text-foreground">{s.value}</p>
            <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${s.color} group-hover:gap-2 transition-all`}>
              View all <ArrowRight className="w-3 h-3" />
            </p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-foreground mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/patient/appointments/new"
            className="flex items-center gap-3 p-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition"
          >
            <CalendarDays className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-semibold text-sm">Book Appointment</span>
          </Link>
          <Link
            href="/practitioners"
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:shadow-md transition text-foreground"
          >
            <FileText className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-semibold text-sm">Browse Practitioners</span>
          </Link>
        </div>
      </div>

      {/* Recent appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Recent appointments</h2>
          <Link href="/patient/appointments" className="text-sm text-primary flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {patient.appointments.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="text-foreground font-medium">No appointments yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Book your first appointment with a practitioner near you.
            </p>
            <Link
              href="/patient/appointments/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition"
            >
              Book now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {patient.appointments.map((appt) => {
              const s = STATUS_STYLE[appt.status] ?? STATUS_STYLE.PENDING;
              const StatusIcon = s.icon;
              return (
                <div key={appt.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {appt.practitioner.user.name ?? "Practitioner"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {appt.practitioner.specialty.toLowerCase()} ·{" "}
                      {new Date(appt.scheduledAt).toLocaleDateString("en-ZM", {
                        weekday: "short", month: "short", day: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(appt.scheduledAt).toLocaleTimeString("en-ZM", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${s.cls}`}>
                    <StatusIcon className="w-3 h-3" />
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
