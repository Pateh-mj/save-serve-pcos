import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Heart, Users, BarChart3, CreditCard, ShieldCheck } from "lucide-react";
import NgoTopupModal from "./NgoTopupModal";
import { abbreviateName, getNgoSubsidyStats, LEDGER_LABEL } from "@/lib/ngo";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Partner Dashboard" };

export default async function NGODashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const ngo = await prisma.nGO.findFirst({
    where: { user: { email: session.user.email } },
  });

  if (!ngo) redirect("/login");

  const { recentSubsidized: subsidizedBillings, ...totals } = await getNgoSubsidyStats(ngo.id);
  const reconciled = Math.abs(totals.ledgerBalance - ngo.fundBalance) < 0.01;

  const stats = [
    { label: "Available Subsidy Fund", value: `ZMW ${ngo.fundBalance.toFixed(2)}`, icon: CreditCard, sub: "Ready for low-income patients" },
    { label: "Free Consultations Funded", value: `${totals.subsidizedVisits}`, icon: Users, sub: "Visits sponsored by this pool" },
    { label: "Total Subsidy Value", value: `ZMW ${totals.subsidizedValue.toFixed(2)}`, icon: Heart, sub: "Direct healthcare impact" },
    { label: "Premium Contributions", value: `ZMW ${totals.premiumContributionValue.toFixed(2)}`, icon: BarChart3, sub: `Robin Hood surplus from ${totals.premiumContributions} paid visits` },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{ngo.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Healthcare Equity & Subsidy Management Command Center
          </p>
        </div>
        <NgoTopupModal />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <s.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">Robin Hood Economic Model (Active)</h2>
            <p className="text-sm text-muted-foreground">
              When a premium-tier patient pays, the amount above the standard tariff is credited to this fund. Together with your
              top-ups, the Policy Guardian draws on this balance to cover visits for Free-tier patients, up to their monthly limit.
            </p>
          </div>
        </div>
      </div>

      {/* Subsidized Patients List */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">Recent Subsidized Beneficiaries</h3>
        {subsidizedBillings.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
            <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm">No subsidized appointments recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subsidizedBillings.map((b) => (
              <div key={b.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground text-sm">{abbreviateName(b.patient.user.name)}</p>
                  <p className="text-xs text-muted-foreground">
                    Consulted: {b.appointment.practitioner.user.name} ({b.appointment.practitioner.specialty})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">ZMW {(b.subsidyAmount ?? b.amount).toFixed(2)} Subsidised</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(b.appointment.scheduledAt)} · {b.appointment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fund ledger: every movement of pool money */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Fund Ledger</h3>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              reconciled ? "bg-success-soft text-success-fg border-success-border" : "bg-danger-soft text-danger-fg border-danger-border"
            }`}
          >
            {reconciled ? "Balance reconciles with ledger" : `Ledger total ZMW ${totals.ledgerBalance.toFixed(2)} differs from balance`}
          </span>
        </div>
        {totals.recentTransactions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No fund movements recorded yet.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            {totals.recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-semibold text-foreground">{LEDGER_LABEL[t.type] ?? t.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(t.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {t.note ? ` · ${t.note}` : ""}
                  </p>
                </div>
                <p className={`font-bold tabular-nums ${t.amount >= 0 ? "text-success-fg" : "text-danger"}`}>
                  {t.amount >= 0 ? "+" : "−"}ZMW {Math.abs(t.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
