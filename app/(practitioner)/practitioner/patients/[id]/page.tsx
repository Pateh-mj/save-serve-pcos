import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Phone, FileText, CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { symptomLabels, TriageLevel } from "@/lib/triage";

export const metadata = { title: "Patient Chart" };

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning-soft text-warning-fg border-warning-border",
  CONFIRMED: "bg-info-soft text-info-fg border-info-border",
  COMPLETED: "bg-success-soft text-success-fg border-success-border",
  CANCELLED: "bg-danger-soft text-danger-fg border-danger-border",
};

function age(dob: Date | null) {
  if (!dob) return null;
  const years = Math.floor((Date.now() - dob.getTime()) / (365.25 * 86_400_000));
  return years >= 0 ? years : null;
}

export default async function PatientChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const practitioner = await prisma.practitioner.findUnique({ where: { userId: session.user.id } });
  if (!practitioner) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      user: true,
      appointments: {
        where: { practitionerId: practitioner.id },
        orderBy: { scheduledAt: "desc" },
      },
      ehrRecords: {
        orderBy: { visitDate: "desc" },
        include: { practitioner: { include: { user: true } } },
      },
    },
  });

  // Same care-relationship rule as /api/ehr: only practitioners treating this patient see the chart
  if (!patient || !patient.appointments.some((a) => a.status !== AppointmentStatus.CANCELLED)) notFound();

  const years = age(patient.dateOfBirth);

  return (
    <div className="max-w-5xl">
      <Link href="/practitioner/patients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> All patients
      </Link>

      <div className="bg-card border border-border rounded-xl p-6 shadow-xs mb-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
            {patient.user.name?.[0]?.toUpperCase() ?? "P"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{patient.user.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {patient.user.phone && (
                <span className="inline-flex items-center gap-1 text-primary"><Phone className="w-3.5 h-3.5" /> {patient.user.phone}</span>
              )}
              {years !== null && <span>{years} years</span>}
              <span>{patient.user.tier} tier</span>
              {patient.nrc && <span>NRC {patient.nrc}</span>}
            </p>
          </div>
        </div>
        {(patient.address || patient.emergencyContact) && (
          <dl className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-border text-sm">
            {patient.address && (
              <div>
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="text-foreground">{patient.address}</dd>
              </div>
            )}
            {patient.emergencyContact && (
              <div>
                <dt className="text-xs text-muted-foreground">Emergency contact</dt>
                <dd className="text-foreground">{patient.emergencyContact}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <div className="grid lg:grid-cols-[2fr_3fr] gap-6">
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" /> Visits with you
          </h2>
          <div className="space-y-2">
            {patient.appointments.map((a) => (
              <div key={a.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{formatDateTime(a.scheduledAt)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[a.status] ?? ""}`}>{a.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {a.channel} ·{" "}
                  <span className={a.triageLevel === TriageLevel.EMERGENCY ? "text-danger-fg font-semibold" : a.triageLevel === TriageLevel.URGENT ? "text-warning-fg font-semibold" : ""}>
                    {a.triageLevel}
                  </span>
                  {a.symptoms && ` · ${symptomLabels(a.symptoms).join(", ")}`}
                </p>
                {a.notes && <p className="text-xs text-foreground/80 mt-1">&ldquo;{a.notes}&rdquo;</p>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Clinical record
          </h2>
          {patient.ehrRecords.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No clinical records yet.</div>
          ) : (
            <div className="space-y-3">
              {patient.ehrRecords.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-foreground">{formatDate(r.visitDate)}</p>
                    <p className="text-xs text-muted-foreground">{r.practitionerId === practitioner.id ? "You" : r.practitioner.user.name}</p>
                  </div>
                  {r.diagnosis && <p className="text-sm text-foreground"><span className="font-semibold">Diagnosis:</span> {r.diagnosis}</p>}
                  {r.prescription && <p className="text-sm text-foreground mt-1"><span className="font-semibold">Prescription:</span> {r.prescription}</p>}
                  {r.notes && <p className="text-sm text-muted-foreground mt-1">{r.notes}</p>}
                  {r.followUpDate && (
                    <p className="text-xs text-primary font-semibold mt-2">Follow-up: {formatDate(r.followUpDate, { weekday: "short", day: "numeric", month: "short" })}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
