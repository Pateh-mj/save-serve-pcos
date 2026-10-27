import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Plus, MapPin, MessageSquareText } from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";
import CancelAppointmentButton from "./CancelAppointmentButton";
import RateVisit from "./RateVisit";
import { formatDate, formatTime } from "@/lib/format";
import { TriageLevel, symptomLabels } from "@/lib/triage";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Panel, EmptyState } from "@/components/app/Panel";
import { btnPrimary } from "@/components/app/buttons";

export const metadata = { title: "My Appointments" };

export default async function AppointmentsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const patient = await prisma.patient.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      appointments: {
        orderBy: { scheduledAt: "desc" },
        include: { practitioner: { include: { user: true } }, feedback: { select: { rating: true } } },
      },
    },
  });
  if (!patient) redirect("/login");

  const now = new Date();
  const appointments = patient.appointments;
  const upcoming = appointments
    .filter((a) => (a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED) && a.scheduledAt >= now)
    .reverse();
  const past = appointments.filter((a) => !upcoming.includes(a));

  type Appt = (typeof appointments)[number];
  const row = (a: Appt, isUpcoming: boolean) => (
    <li key={a.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className={`w-14 shrink-0 rounded-lg border text-center py-1.5 ${isUpcoming ? "border-primary/30 bg-accent" : "border-border bg-secondary"}`}>
          <p className={`text-xs font-semibold uppercase ${isUpcoming ? "text-primary" : "text-muted-foreground"}`}>
            {formatDate(a.scheduledAt, { month: "short" })}
          </p>
          <p className="text-xl font-bold text-foreground leading-tight">{formatDate(a.scheduledAt, { day: "numeric" })}</p>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{a.practitioner.user.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(a.scheduledAt, { weekday: "long" })}, {formatTime(a.scheduledAt)}
            <span className="capitalize"> · {a.practitioner.specialty.toLowerCase()}</span>
          </p>
          {a.practitioner.location && (
            <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {a.practitioner.location}
            </p>
          )}
          {a.symptoms && <p className="text-xs text-muted-foreground mt-1">Reason: {symptomLabels(a.symptoms).join(", ")}</p>}
          {a.notes && (
            <p className="text-xs text-muted-foreground mt-1 inline-flex items-start gap-1">
              <MessageSquareText className="w-3 h-3 mt-0.5 shrink-0" /> {a.notes}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end pl-18 sm:pl-0">
        {a.triageLevel !== TriageLevel.ROUTINE && <StatusBadge kind="triage" value={a.triageLevel} />}
        <StatusBadge kind="channel" value={a.channel} />
        <StatusBadge kind="appointment" value={a.status} />
        {isUpcoming && <CancelAppointmentButton appointmentId={a.id} />}
        {a.status === AppointmentStatus.COMPLETED && <RateVisit appointmentId={a.id} existing={a.feedback?.rating} />}
      </div>
    </li>
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Appointments"
        title="My appointments"
        description="Every visit you've booked, on the web or by USSD."
        actions={
          <Link href="/patient/appointments/new" className={btnPrimary}>
            <Plus className="w-4 h-4" /> Book a visit
          </Link>
        }
      />

      {appointments.length === 0 ? (
        <Panel>
          <EmptyState
            icon={CalendarDays}
            title="No appointments yet"
            action={<Link href="/patient/appointments/new" className={btnPrimary}>Book your first visit</Link>}
          >
            Choose a verified nurse, pharmacist or physiotherapist and a time that suits you.
          </EmptyState>
        </Panel>
      ) : (
        <div className="space-y-6">
          <Panel title="Upcoming" description={upcoming.length ? `${upcoming.length} scheduled` : undefined} flush>
            {upcoming.length ? (
              <ul className="divide-y divide-border">{upcoming.map((a) => row(a, true))}</ul>
            ) : (
              <p className="px-5 py-6 text-sm text-muted-foreground">Nothing scheduled. Book a visit whenever you need one.</p>
            )}
          </Panel>
          {past.length > 0 && (
            <Panel title="Past visits" description="Rate completed visits to help us improve care." flush>
              <ul className="divide-y divide-border">{past.map((a) => row(a, false))}</ul>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
