import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, Wallet, HeartHandshake, BadgeCheck, Info } from "lucide-react";
import { BillingStatus } from "@/lib/constants";
import BillingItemActions from "./BillingItemActions";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Panel, EmptyState } from "@/components/app/Panel";
import { btnPrimary } from "@/components/app/buttons";

export const metadata = { title: "My Billing" };

const zmw = (n: number) => `ZMW ${n.toFixed(2)}`;

const TIER_NOTE: Record<string, string> = {
  FREE: "Your visits are paid for by partner NGOs through the Robin Hood subsidy pool.",
  BASIC: "You pay the standard consultation fee.",
  PREMIUM: "Your fee includes a contribution that funds free care for others.",
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const patient = await prisma.patient.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      user: true,
      billings: {
        orderBy: { createdAt: "desc" },
        include: { appointment: { include: { practitioner: { include: { user: true } } } } },
      },
    },
  });
  if (!patient) redirect("/login");

  const due = (b: { discountedAmount: number | null; amount: number }) => b.discountedAmount ?? b.amount;
  const sum = (status: string) => patient.billings.filter((b) => b.status === status).reduce((s, b) => s + due(b), 0);
  const totalSubsidised = patient.billings.reduce((s, b) => s + (b.subsidyApplied ? b.subsidyAmount ?? b.amount : 0), 0);
  const pending = patient.billings.filter((b) => b.status === BillingStatus.PENDING);

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Billing"
        title="Bills & subsidies"
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Set automatically by the Policy Guardian for your plan: <StatusBadge kind="tier" value={patient.user.tier} />
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="To pay" value={zmw(sum(BillingStatus.PENDING))} icon={Wallet} tone={pending.length ? "warning" : "neutral"} hint={`${pending.length} unpaid bill${pending.length === 1 ? "" : "s"}`} />
        <StatCard label="Subsidies received" value={zmw(totalSubsidised)} icon={HeartHandshake} tone="brand" hint="Covered by partner NGOs" />
        <StatCard label="Paid so far" value={zmw(sum(BillingStatus.PAID))} icon={BadgeCheck} tone="success" hint="Mobile money and cash" />
      </div>

      <div className="flex gap-3 rounded-xl border border-border bg-card px-5 py-4 mb-6 text-sm shadow-xs">
        <Info className="w-5 h-5 text-primary shrink-0" />
        <p className="text-muted-foreground">
          <strong className="text-foreground">How your bill is set.</strong> {TIER_NOTE[patient.user.tier] ?? TIER_NOTE.BASIC}
        </p>
      </div>

      <Panel title="Bill history" flush>
        {patient.billings.length === 0 ? (
          <EmptyState icon={CreditCard} title="No bills yet" action={<Link href="/patient/appointments/new" className={btnPrimary}>Book a visit</Link>}>
            A bill is created automatically when you book.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {patient.billings.map((b) => {
              const subsidy = b.subsidyApplied ? b.subsidyAmount ?? b.amount : 0;
              const surplus = Math.max(0, due(b) - b.amount);
              return (
                <li key={b.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{b.appointment?.practitioner?.user?.name ?? "Consultation"}</p>
                      <StatusBadge kind="billing" value={b.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Visit on {formatDate(b.appointment?.scheduledAt ?? b.createdAt, { day: "numeric", month: "short", year: "numeric" })} · {b.tier.toLowerCase()} plan
                    </p>
                    {/* Fee breakdown: shows the Robin Hood model at work on this bill */}
                    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <div>Standard fee <dd className="inline font-semibold text-foreground">{zmw(b.amount)}</dd></div>
                      {subsidy > 0 && <div>NGO subsidy <dd className="inline font-semibold text-primary">−{zmw(subsidy)}</dd></div>}
                      {surplus > 0 && <div>Community contribution <dd className="inline font-semibold text-premium-fg">+{zmw(surplus)}</dd></div>}
                    </dl>
                  </div>
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                    <p className="text-base font-semibold text-foreground">{zmw(b.status === BillingStatus.SUBSIDIZED || b.status === BillingStatus.WAIVED ? 0 : due(b))}</p>
                    {b.status === BillingStatus.PENDING && <BillingItemActions billingId={b.id} amount={due(b)} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
