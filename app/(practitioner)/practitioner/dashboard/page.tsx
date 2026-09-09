import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CalendarDays, Users, Clock, CheckCircle2, Stethoscope, Phone, ShieldCheck } from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";
import PractitionerAppointmentActions from "./PractitionerAppointmentActions";

export default async function PractitionerDashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const practitioner = await prisma.practitioner.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      user: true,
      appointments: {
        orderBy: { scheduledAt: "asc" },
        include: {
          patient: { include: { user: true } },
          billing: true,
          ehrRecord: true,
        },
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

  const pendingOrUpcoming = practitioner.appointments.filter(
    (a) => a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED
  );

  const completed = practitioner.appointments.filter((a) => a.status === AppointmentStatus.COMPLETED);
  const totalUniquePatients = new Set(practitioner.appointments.map((a) => a.patientId)).size;

  const stats = [
    { label: "Today's Schedule", value: todayAppts.length, icon: CalendarDays, color: "text-primary" },
    { label: "Pending / Upcoming", value: pendingOrUpcoming.length, icon: Clock, color: "text-amber-600" },
    { label: "Completed Consultations", value: completed.length, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Total Patients Served", value: totalUniquePatients, icon: Users, color: "text-blue-600" },
  ];

  return (
    <div className="p-8 max-w-6xl">
      {/* Top Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Command Centre — {session.user.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span className="font-semibold text-primary">{practitioner.specialty}</span> · {practitioner.location || "Lusaka, Zambia"} · 
            {practitioner.isVerified ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" /> Licensed & Verified ({practitioner.licenseNo})
              </span>
            ) : (
              <span className="text-amber-600 font-medium text-xs">Verification in progress</span>
            )}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color}`} strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main Appointment Queue & Clinical Action Centre */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Clinical Appointment Queue</h2>
          <p className="text-xs text-muted-foreground">Manage incoming Web & USSD patient visits in real-time</p>
        </div>
      </div>

      {practitioner.appointments.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
          <p className="font-semibold text-foreground text-lg">No appointments scheduled</p>
          <p className="text-sm text-muted-foreground mt-1">
            When patients book consultations via the Web app or USSD *384#, they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {practitioner.appointments.map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                    {a.patient.user.name?.[0]?.toUpperCase() ?? "P"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-base">{a.patient.user.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground font-medium uppercase">
                        {a.channel} Channel
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        a.status === AppointmentStatus.COMPLETED
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : a.status === AppointmentStatus.CONFIRMED
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : a.status === AppointmentStatus.CANCELLED
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {a.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      Scheduled: <span className="font-semibold text-foreground">{new Date(a.scheduledAt).toLocaleDateString("en-ZM", {
                        weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}</span>
                      {a.patient.user.phone && (
                        <span className="ml-3 inline-flex items-center gap-1 text-primary">
                          <Phone className="w-3 h-3" /> {a.patient.user.phone}
                        </span>
                      )}
                    </p>

                    {a.notes && (
                      <p className="text-xs bg-muted/50 p-2 rounded-lg mt-2 text-foreground/80">
                        <span className="font-semibold">Patient Note:</span> {a.notes}
                      </p>
                    )}

                    {a.ehrRecord && (
                      <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-emerald-900">Recorded Clinical EHR:</p>
                        <p><span className="font-semibold text-emerald-800">Diagnosis:</span> {a.ehrRecord.diagnosis}</p>
                        {a.ehrRecord.prescription && (
                          <p><span className="font-semibold text-emerald-800">Prescription:</span> {a.ehrRecord.prescription}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Action Controls */}
                <div className="shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                  <PractitionerAppointmentActions appointment={a} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
