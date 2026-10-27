import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays, Clock, CheckCircle2, Stethoscope, Phone, ShieldCheck, AlertTriangle, Siren, Activity, FileText,
} from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";
import PractitionerAppointmentActions from "./PractitionerAppointmentActions";
import { clinicDateKey, formatDate, formatTime } from "@/lib/format";
import { TRIAGE_PRIORITY, TriageLevel, symptomLabels } from "@/lib/triage";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Panel, EmptyState } from "@/components/app/Panel";
import { TONE_EDGE } from "@/components/app/tones";
import { BarChart } from "@/components/charts/BarChart";
import { SegmentBar } from "@/components/charts/SegmentBar";
import { weeklyBuckets } from "@/lib/chart-data";

export const metadata = { title: "Triage Queue" };

const EDGE: Record<string, string> = {
  [TriageLevel.EMERGENCY]: TONE_EDGE.danger,
  [TriageLevel.URGENT]: TONE_EDGE.warning,
  [TriageLevel.ROUTINE]: TONE_EDGE.neutral,
};

export default async function PractitionerDashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const practitioner = await prisma.practitioner.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      user: true,
      appointments: {
        orderBy: { scheduledAt: "asc" },
        include: { patient: { include: { user: true } }, ehrRecord: true },
      },
    },
  });
  if (!practitioner) redirect("/login");

  const all = practitioner.appointments;
  const today = clinicDateKey();
  const todayAppts = all.filter((a) => clinicDateKey(a.scheduledAt) === today && a.status !== AppointmentStatus.CANCELLED);
  const active = all.filter((a) => a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED);
  const completed = all.filter((a) => a.status === AppointmentStatus.COMPLETED);
  const count = (lvl: string) => active.filter((a) => a.triageLevel === lvl).length;

  // Queue: emergency first, then urgent, then routine; earliest first within a level
  const queue = [...active].sort(
    (a, b) =>
      (TRIAGE_PRIORITY[a.triageLevel] ?? 2) - (TRIAGE_PRIORITY[b.triageLevel] ?? 2) ||
      a.scheduledAt.getTime() - b.scheduledAt.getTime()
  );
  const history = all
    .filter((a) => !active.includes(a))
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
    .slice(0, 10);
  const weeks = weeklyBuckets(completed, (a) => a.scheduledAt, (a) => [a.channel === "WEB" ? 1 : 0, a.channel === "USSD" ? 1 : 0], 8);

  type Appt = (typeof all)[number];
  const row = (a: Appt, inQueue: boolean) => (
    <li key={a.id} className="relative pl-5 pr-5 py-4">
      {inQueue && <span aria-hidden className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${EDGE[a.triageLevel] ?? TONE_EDGE.neutral}`} />}
      <div className="flex flex-col xl:flex-row xl:items-center gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold shrink-0">
            {a.patient.user.name?.[0]?.toUpperCase() ?? "P"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/practitioner/patients/${a.patientId}`} className="font-semibold text-foreground hover:text-primary">
                {a.patient.user.name}
              </Link>
              {inQueue && <StatusBadge kind="triage" value={a.triageLevel} solid={a.triageLevel === TriageLevel.EMERGENCY} />}
              <StatusBadge kind="appointment" value={a.status} />
              <StatusBadge kind="channel" value={a.channel} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(a.scheduledAt, { weekday: "short", day: "numeric", month: "short" })}, {formatTime(a.scheduledAt)}
              {a.patient.user.phone && (
                <a href={`tel:${a.patient.user.phone}`} className="ml-3 inline-flex items-center gap-1 text-primary hover:underline">
                  <Phone className="w-3 h-3" /> {a.patient.user.phone}
                </a>
              )}
            </p>
            {a.symptoms && (
              <p className="text-sm text-foreground mt-1">
                <span className="text-muted-foreground">Symptoms:</span> {symptomLabels(a.symptoms).join(", ")}
              </p>
            )}
            {a.notes && <p className="text-sm text-muted-foreground mt-1 italic">&ldquo;{a.notes}&rdquo;</p>}
            {a.ehrRecord && (
              <p className="mt-2 text-sm inline-flex items-start gap-1.5 text-success-deep">
                <FileText className="w-4 h-4 mt-0.5 shrink-0 text-success" />
                <span><span className="font-medium">Diagnosis:</span> {a.ehrRecord.diagnosis}</span>
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 pl-15 xl:pl-0">
          <PractitionerAppointmentActions
            appointment={{ ...a, symptomList: a.symptoms ? symptomLabels(a.symptoms) : [] }}
          />
        </div>
      </div>
    </li>
  );

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Triage queue"
        title={session.user.name ?? "Practitioner"}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="capitalize">{practitioner.specialty.toLowerCase()}</span>
            <span aria-hidden>·</span>
            <span>{practitioner.location || "Lusaka, Zambia"}</span>
            <span aria-hidden>·</span>
            {practitioner.isVerified ? (
              <span className="inline-flex items-center gap-1 text-success-fg font-medium">
                <ShieldCheck className="w-4 h-4" /> Verified · {practitioner.licenseNo}
              </span>
            ) : (
              <span className="text-warning-fg font-medium">Verification in progress</span>
            )}
          </span>
        }
        actions={<Link href="/practitioner/schedule" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-secondary"><CalendarDays className="w-4 h-4" /> My schedule</Link>}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Today" value={todayAppts.length} icon={CalendarDays} tone="info" hint="Visits scheduled today" />
        <StatCard label="Active queue" value={active.length} icon={Clock} tone="warning" hint="Pending or confirmed" />
        <StatCard
          label="Need priority"
          value={count(TriageLevel.EMERGENCY) + count(TriageLevel.URGENT)}
          icon={AlertTriangle}
          tone={count(TriageLevel.EMERGENCY) ? "danger" : "warning"}
          hint={`${count(TriageLevel.EMERGENCY)} emergency · ${count(TriageLevel.URGENT)} urgent`}
        />
        <StatCard label="Consultations done" value={completed.length} icon={CheckCircle2} tone="success" hint="All time" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 mb-6">
        <Panel className="lg:col-span-2" title="Queue by triage level" description="WHO ETAT-style danger signs set the order.">
          <SegmentBar
            title="Active visits by triage level"
            segments={[
              { label: "Emergency", value: count(TriageLevel.EMERGENCY), color: "var(--danger)", icon: Siren },
              { label: "Urgent", value: count(TriageLevel.URGENT), color: "var(--warning)", icon: AlertTriangle },
              { label: "Routine", value: count(TriageLevel.ROUTINE), color: "var(--success)", icon: Activity },
            ]}
          />
        </Panel>
        <Panel className="lg:col-span-3" title="Consultations by channel" description="Completed visits per week, last 8 weeks">
          <BarChart
            title="Completed consultations per week by booking channel"
            data={weeks}
            series={[{ name: "Web", color: "var(--chart-1)" }, { name: "USSD", color: "var(--chart-2)" }]}
            height={150}
          />
        </Panel>
      </div>

      <Panel title="Active queue" description="Highest priority first. Accept, consult and record, all from here." flush className="mb-6">
        {queue.length === 0 ? (
          <EmptyState icon={Stethoscope} title="The queue is clear">
            New bookings from the web app or USSD *384# appear here automatically, ordered by triage level.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">{queue.map((a) => row(a, true))}</ul>
        )}
      </Panel>

      {history.length > 0 && (
        <Panel title="Recent history" description="Last 10 completed or cancelled visits" flush>
          <ul className="divide-y divide-border">{history.map((a) => row(a, false))}</ul>
        </Panel>
      )}
    </div>
  );
}
