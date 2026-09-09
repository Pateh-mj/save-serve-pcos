import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, CheckCircle2, Clock, ShieldCheck, Heart } from "lucide-react";
import { BillingStatus } from "@/lib/constants";
import BillingItemActions from "./BillingItemActions";

const STATUS_STYLE: Record<string, { cls: string; label: string; icon: typeof CheckCircle2 }> = {
  [BillingStatus.PAID]:       { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: "Paid", icon: CheckCircle2 },
  [BillingStatus.SUBSIDIZED]: { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: "100% Subsidised", icon: ShieldCheck },
  [BillingStatus.PENDING]:    { cls: "bg-amber-50 text-amber-700 border border-amber-200", label: "Pending Payment", icon: Clock },
  [BillingStatus.WAIVED]:     { cls: "bg-blue-50 text-blue-700 border border-blue-200", label: "Fee Waived", icon: CheckCircle2 },
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
        include: {
          appointment: { include: { practitioner: { include: { user: true } } } },
          policy: true,
        },
      },
    },
  });

  if (!patient) redirect("/login");

  const totalPaid = patient.billings
    .filter((b) => b.status === BillingStatus.PAID)
    .reduce((sum, b) => sum + (b.discountedAmount ?? b.amount), 0);

  const totalSubsidized = patient.billings
    .filter((b) => b.status === BillingStatus.SUBSIDIZED || b.subsidyApplied)
    .reduce((sum, b) => sum + (b.subsidyAmount ?? b.amount), 0);

  const totalPending = patient.billings
    .filter((b) => b.status === BillingStatus.PENDING)
    .reduce((sum, b) => sum + (b.discountedAmount ?? b.amount), 0);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My Billing & Subsidies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Policy Guardian automatic healthcare tier: <span className="font-semibold text-primary">{patient.user.tier} TIER</span>
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold text-foreground">
          <Heart className="w-3.5 h-3.5 text-primary" /> Robin Hood Subsidy Active
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Pending Payment</p>
          <p className="text-3xl font-extrabold text-amber-600">ZMW {totalPending.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Outstanding patient share</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">NGO Subsidies Received</p>
          <p className="text-3xl font-extrabold text-primary">ZMW {totalSubsidized.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Cross-subsidised care</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Total Paid</p>
          <p className="text-3xl font-extrabold text-foreground">ZMW {totalPaid.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Settled consultations</p>
        </div>
      </div>

      {patient.billings.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
          <p className="font-semibold text-foreground">No billing records yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Billing is calculated automatically when you book appointments.</p>
          <Link href="/patient/appointments/new" className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90">
            Book an Appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {patient.billings.map((b) => {
            const st = STATUS_STYLE[b.status] ?? STATUS_STYLE[BillingStatus.PENDING];
            const Icon = st.icon;
            const payableAmount = b.discountedAmount ?? b.amount;

            return (
              <div key={b.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {b.appointment?.practitioner?.user?.name ?? "Medical Consultation"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(b.createdAt).toLocaleDateString("en-ZM", { year: "numeric", month: "short", day: "numeric" })} · Tier: {b.tier}
                    </p>
                    {b.subsidyApplied && (
                      <p className="text-xs text-primary mt-1 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> NGO Subsidy Applied: ZMW {(b.subsidyAmount ?? b.amount).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                  <div className="text-right">
                    <p className="font-bold text-foreground text-base">ZMW {payableAmount.toFixed(2)}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${st.cls}`}>
                      <Icon className="w-3 h-3" />{st.label}
                    </span>
                  </div>

                  {b.status === BillingStatus.PENDING && (
                    <BillingItemActions billingId={b.id} amount={payableAmount} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
