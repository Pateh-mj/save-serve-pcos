import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HeartHandshake, Users, Stethoscope, Star, ArrowRight, Wallet, ShieldCheck, ShieldAlert } from "lucide-react";
import NgoTopupModal from "./NgoTopupModal";
import { abbreviateName, getNgoSubsidyStats, LEDGER_LABEL } from "@/lib/ngo";
import { formatDate } from "@/lib/format";
import { getConsultationFee } from "@/lib/settings";
import { monthlyBuckets } from "@/lib/chart-data";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Panel, EmptyState } from "@/components/app/Panel";
import { BarChart } from "@/components/charts/BarChart";

export const metadata = { title: "Partner Dashboard" };

const zmw = (n: number) => `ZMW ${n.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function NGODashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const ngo = await prisma.nGO.findFirst({ where: { user: { email: session.user.email } } });
  if (!ngo) redirect("/login");

  const [stats, byType, funded, patients, fee] = await Promise.all([
    getNgoSubsidyStats(ngo.id, 6),
    prisma.fundTransaction.groupBy({ by: ["type"], where: { ngoId: ngo.id }, _sum: { amount: true } }),
    prisma.billing.findMany({ where: { ngoId: ngo.id, status: "SUBSIDIZED" }, select: { createdAt: true } }),
    prisma.billing.groupBy({ by: ["patientId"], where: { ngoId: ngo.id, status: "SUBSIDIZED" } }),
    getConsultationFee(),
  ]);
  const total = (type: string) => byType.find((t) => t.type === type)?._sum.amount ?? 0;
  const topups = total("OPENING") + total("TOPUP");
  const surplus = total("PREMIUM_CREDIT");
  const spent = -(total("SUBSIDY_DEBIT") + total("SUBSIDY_REFUND"));
  const reconciled = Math.abs(stats.ledgerBalance - ngo.fundBalance) < 0.01;
  const visitsLeft = fee > 0 ? Math.floor(ngo.fundBalance / fee) : 0;
  const months = monthlyBuckets(funded, (b) => b.createdAt, () => [1], 6);

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Funding partner"
        title={ngo.name}
        description="Your health-equity pool and the care it has paid for."
        actions={<NgoTopupModal />}
      />

      {/* Pool balance + Robin Hood flow */}
      <section className="bg-card border border-border rounded-xl shadow-xs mb-6 overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_1.6fr]">
          <div className="p-6 bg-primary text-primary-foreground">
            <p className="text-sm font-medium text-primary-foreground/85 inline-flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Pool balance
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight">{zmw(ngo.fundBalance)}</p>
            <p className="mt-2 text-primary-foreground/90">
              Enough for <strong>{visitsLeft}</strong> more free visit{visitsLeft === 1 ? "" : "s"} at {zmw(fee)} each.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-white/15 px-2.5 py-1">
              {reconciled ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {reconciled ? "Balance matches the ledger" : `Ledger shows ${zmw(stats.ledgerBalance)}`}
            </p>
          </div>

          <div className="p-6">
            <p className="text-sm font-semibold text-foreground">How the Robin Hood model moves money</p>
            <p className="text-xs text-muted-foreground mb-5">All-time totals for this pool</p>
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center">
              <div className="space-y-2">
                <FlowBox label="Your top-ups" value={zmw(topups)} tone="brand" />
                <FlowBox label="Premium surplus" value={zmw(surplus)} tone="premium" icon={Star} />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" aria-hidden />
              <FlowBox label="Equity pool" value={zmw(ngo.fundBalance)} tone="neutral" icon={Wallet} big />
              <ArrowRight className="w-5 h-5 text-muted-foreground" aria-hidden />
              <FlowBox label="Free visits funded" value={zmw(spent)} tone="success" icon={Stethoscope} />
            </div>
            <p className="text-xs text-muted-foreground mt-5">
              Premium-tier patients pay above the standard fee; the Policy Guardian credits that surplus here and draws on the
              pool to cover free-tier visits, up to each patient&apos;s monthly limit.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Visits funded" value={stats.subsidizedVisits} icon={Stethoscope} tone="success" href="/ngo/impact" />
        <StatCard label="Patients reached" value={patients.length} icon={Users} tone="info" href="/ngo/beneficiaries" />
        <StatCard label="Care value funded" value={zmw(stats.subsidizedValue)} icon={HeartHandshake} tone="brand" />
        <StatCard label="Premium surplus received" value={zmw(stats.premiumContributionValue)} icon={Star} tone="premium" hint={`From ${stats.premiumContributions} paid visit${stats.premiumContributions === 1 ? "" : "s"}`} />
      </div>

      <Panel title="Free visits funded per month" description="Last 6 months" className="mb-6">
        <BarChart title="Free visits funded per month" data={months} series={[{ name: "Visits funded", color: "var(--chart-1)" }]} height={160} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent beneficiaries"
          description="Names shortened to protect patient privacy"
          action={<Link href="/ngo/beneficiaries" className="text-sm font-medium text-primary hover:underline">View all</Link>}
          flush
        >
          {stats.recentSubsidized.length === 0 ? (
            <EmptyState icon={HeartHandshake} title="No funded visits yet">Free-tier bookings drawn from your pool appear here.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recentSubsidized.map((b) => (
                <li key={b.id} className="px-5 py-3 flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{abbreviateName(b.patient.user.name)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {b.appointment.practitioner.user.name} · {formatDate(b.appointment.scheduledAt, { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground shrink-0">{zmw(b.subsidyAmount ?? b.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Latest ledger entries"
          description="Every movement of pool money"
          action={<Link href="/ngo/funding" className="text-sm font-medium text-primary hover:underline">Full ledger</Link>}
          flush
        >
          {stats.recentTransactions.length === 0 ? (
            <EmptyState icon={Wallet} title="No movements yet">Top-ups and funded visits are recorded here.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recentTransactions.map((t) => (
                <li key={t.id} className="px-5 py-3 flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{LEDGER_LABEL[t.type] ?? t.type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <p className={`font-semibold shrink-0 ${t.amount >= 0 ? "text-success-fg" : "text-foreground"}`}>
                    {t.amount >= 0 ? "+" : "−"}
                    {zmw(Math.abs(t.amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

const FLOW_TONE = {
  brand: "border-primary/30 bg-accent",
  premium: "border-premium-border bg-premium-soft",
  success: "border-success-border bg-success-soft",
  neutral: "border-border bg-secondary",
} as const;

function FlowBox({ label, value, tone, icon: Icon, big }: { label: string; value: string; tone: keyof typeof FLOW_TONE; icon?: React.ElementType; big?: boolean }) {
  return (
    <div className={`rounded-lg border px-2 py-3 ${FLOW_TONE[tone]} ${big ? "py-5" : ""}`}>
      <p className="text-xs text-muted-foreground inline-flex items-center gap-1 justify-center">
        {Icon && <Icon className="w-3.5 h-3.5" aria-hidden />} {label}
      </p>
      <p className={`font-bold text-foreground mt-0.5 ${big ? "text-base sm:text-lg" : "text-sm"}`}>{value}</p>
    </div>
  );
}
