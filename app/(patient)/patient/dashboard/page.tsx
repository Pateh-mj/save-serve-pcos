import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { clinicHour, formatDate, formatTime } from "@/lib/format";
import { getFreeVisitAllowance } from "@/lib/policy-guardian";
import { symptomLabels } from "@/lib/triage";
import {
  CalendarDays, CalendarPlus, FileText, CreditCard, ArrowRight, HeartHandshake,
  Stethoscope, MapPin, Pill, ClipboardCheck, Smartphone,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Panel, EmptyState } from "@/components/app/Panel";
import { Meter } from "@/components/charts/SegmentBar";

export const metadata = { title: "My Health" };

const zmw = (n: number) => `ZMW ${n.toFixed(2)}`;

export default async function PatientDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { tier: true } },
      appointments: {
        orderBy: { scheduledAt: "desc" },
        take: 6,
        include: { practitioner: { include: { user: true } } },
      },
      ehrRecords: { orderBy: { visitDate: "desc" }, take: 1, include: { practitioner: { include: { user: true } } } },
      billings: { select: { status: true, discountedAmount: true, amount: true, subsidyAmount: true } },
      _count: { select: { appointments: { where: { status: "COMPLETED" } } } },
    },
  });
  if (!patient) redirect("/login");

  const tier = patient.user.tier;
  const now = new Date();
  const upcoming = patient.appointments
    .filter((a) => (a.status === "PENDING" || a.status === "CONFIRMED") && a.scheduledAt >= now)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const next = upcoming[0];
  const unpaid = patient.billings.filter((b) => b.status === "PENDING");
  const unpaidTotal = unpaid.reduce((s, b) => s + (b.discountedAmount ?? b.amount), 0);
  const subsidised = patient.billings.reduce((s, b) => s + (b.subsidyAmount ?? 0), 0);
  const allowance = tier === "FREE" ? await getFreeVisitAllowance(patient.id) : null;
  const lastRecord = patient.ehrRecords[0];

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const hour = clinicHour();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="My health"
        title={`${greeting}, ${firstName}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Your care plan: <StatusBadge kind="tier" value={tier} />
          </span>
        }
        actions={
          <Link href="/patient/appointments/new" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-xs hover:bg-primary/90 transition">
            <CalendarPlus className="w-4 h-4" /> Book a visit
          </Link>
        }
      />

      {/* Next visit: the one thing a patient opens the app to check */}
      {next ? (
        <section className="relative overflow-hidden rounded-xl bg-primary text-primary-foreground p-6 sm:p-7 mb-6 shadow-sm">
          <svg aria-hidden viewBox="0 0 24 24" className="absolute -right-6 -top-6 w-40 h-40 opacity-10" fill="currentColor">
            <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
          </svg>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">Your next visit</p>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                {formatDate(next.scheduledAt, { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="mt-1 text-primary-foreground/90">
                {formatTime(next.scheduledAt)} with <strong>{next.practitioner.user.name}</strong>
                <span className="capitalize"> · {next.practitioner.specialty.toLowerCase()}</span>
              </p>
              {next.practitioner.location && (
                <p className="mt-1 text-sm text-primary-foreground/80 inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {next.practitioner.location}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-white/15 text-xs font-semibold">
                {next.status === "CONFIRMED" ? "Confirmed by your practitioner" : "Awaiting confirmation"}
              </span>
              {next.triageLevel !== "ROUTINE" && <StatusBadge kind="triage" value={next.triageLevel} solid />}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-primary/40 bg-accent/50 p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="w-11 h-11 rounded-lg bg-card text-primary inline-flex items-center justify-center shrink-0 shadow-xs">
            <Stethoscope className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-foreground">No upcoming visits</p>
            <p className="text-sm text-muted-foreground">Feeling unwell? A nurse, pharmacist or physiotherapist can see you, often the same week.</p>
          </div>
          <Link href="/patient/appointments/new" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
            Book now <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Upcoming visits" value={upcoming.length} icon={CalendarDays} tone="info" href="/patient/appointments" />
        <StatCard label="Completed visits" value={patient._count.appointments} icon={ClipboardCheck} tone="success" href="/patient/records" />
        <StatCard
          label="Unpaid bills"
          value={unpaid.length}
          icon={CreditCard}
          tone={unpaid.length ? "warning" : "neutral"}
          hint={unpaid.length ? `${zmw(unpaidTotal)} due` : "All settled"}
          href="/patient/billing"
        />
        <StatCard label="Subsidies received" value={zmw(subsidised)} icon={HeartHandshake} tone="brand" hint="Paid for by partner NGOs" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          title="Recent visits"
          action={<Link href="/patient/appointments" className="text-sm font-medium text-primary hover:underline">View all</Link>}
          flush
        >
          {patient.appointments.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No visits yet">Book your first visit with a practitioner near you.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {patient.appointments.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-12 text-center shrink-0">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{formatDate(a.scheduledAt, { month: "short" })}</p>
                    <p className="text-lg font-bold text-foreground leading-none mt-0.5">{formatDate(a.scheduledAt, { day: "numeric" })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{a.practitioner.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      <span className="capitalize">{a.practitioner.specialty.toLowerCase()}</span> · {formatTime(a.scheduledAt)}
                      {a.symptoms && ` · ${symptomLabels(a.symptoms).slice(0, 2).join(", ")}`}
                    </p>
                  </div>
                  <StatusBadge kind="appointment" value={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="lg:col-span-2 space-y-6">
          {allowance && (
            <Panel title="Subsidised visits this month">
              {allowance.max === null ? (
                <p className="text-sm text-muted-foreground">
                  Your plan has no monthly limit. <strong className="text-foreground">{allowance.used}</strong> visit{allowance.used === 1 ? "" : "s"} subsidised so far.
                </p>
              ) : (
                <>
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-2xl font-bold text-foreground">
                      {allowance.used} <span className="text-base font-medium text-muted-foreground">of {allowance.max}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{Math.max(0, allowance.max - allowance.used)} left</p>
                  </div>
                  <Meter
                    value={allowance.used}
                    max={allowance.max}
                    label="Subsidised visits used this month"
                    color={allowance.used >= allowance.max ? "var(--warning)" : "var(--primary)"}
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    Free-tier visits are funded by partner NGOs through the Robin Hood pool. After the limit, the standard fee applies.
                  </p>
                </>
              )}
            </Panel>
          )}

          <Panel
            title="Latest health record"
            action={<Link href="/patient/records" className="text-sm font-medium text-primary hover:underline">All records</Link>}
          >
            {lastRecord ? (
              <div className="space-y-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  {formatDate(lastRecord.visitDate, { day: "numeric", month: "long", year: "numeric" })} · {lastRecord.practitioner.user.name}
                </p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Diagnosis</p>
                  <p className="text-foreground mt-0.5">{lastRecord.diagnosis ?? "Not recorded"}</p>
                </div>
                {lastRecord.prescription && (
                  <div className="flex gap-2 rounded-lg bg-info-soft border border-info-border p-3">
                    <Pill className="w-4 h-4 text-info shrink-0 mt-0.5" />
                    <p className="text-info-deep">{lastRecord.prescription}</p>
                  </div>
                )}
                {lastRecord.followUpDate && (
                  <p className="text-xs text-foreground">
                    Follow-up: <strong>{formatDate(lastRecord.followUpDate, { weekday: "short", day: "numeric", month: "short" })}</strong>
                  </p>
                )}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No records yet">Your practitioner adds a record after each completed visit.</EmptyState>
            )}
          </Panel>

          <div className="rounded-xl border border-border bg-card p-5 flex gap-3 shadow-xs">
            <Smartphone className="w-5 h-5 text-primary shrink-0" strokeWidth={1.75} />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">No data? No problem.</strong> Dial <strong className="text-foreground">*384#</strong> from any phone to book, check visits or pay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
