import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, CheckCircle2, Clock } from "lucide-react";
import { BillingStatus } from "@/lib/constants";

const STATUS_STYLE: Record<string, { cls: string; icon: typeof CheckCircle2 }> = {
  [BillingStatus.PAID]:    { cls: "bg-accent text-primary border border-primary/20", icon: CheckCircle2 },
  [BillingStatus.PENDING]: { cls: "bg-amber-50 text-amber-700 border border-amber-200", icon: Clock },
  [BillingStatus.WAIVED]:  { cls: "bg-blue-50 text-blue-700 border border-blue-200", icon: CheckCircle2 },
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const patient = await prisma.patient.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      billings: {
        orderBy: { createdAt: "desc" },
        include: { appointment: { include: { practitioner: { include: { user: true } } } } },
      },
    },
  });

  if (!patient) redirect("/login");

  const totalPaid = patient.billings
    .filter((b) => b.status === BillingStatus.PAID)
    .reduce((sum, b) => sum + b.amount, 0);
  const totalPending = patient.billings
    .filter((b) => b.status === BillingStatus.PENDING)
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-foreground">My Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">View all billing records and payment history</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Total Paid</p>
          <p className="text-3xl font-extrabold text-primary">K{totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Pending Payment</p>
          <p className="text-3xl font-extrabold text-amber-600">K{totalPending.toFixed(2)}</p>
        </div>
      </div>

      {patient.billings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
          <p className="font-semibold text-foreground">No billing records yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Billing is generated automatically when you book appointments.</p>
          <Link href="/patient/appointments/new" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90">
            Book an Appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {patient.billings.map((b) => {
            const st = STATUS_STYLE[b.status] ?? STATUS_STYLE[BillingStatus.PENDING];
            const Icon = st.icon;
            return (
              <div key={b.id} className="bg-white border border-border rounded-xl p-5 shadow-sm flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{b.appointment?.practitioner?.user?.name ?? "Appointment"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(b.createdAt).toLocaleDateString("en-ZM", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                  {b.subsidyApplied && b.subsidyAmount != null && (
                    <p className="text-xs text-primary mt-0.5 font-medium">Subsidy applied: K{b.subsidyAmount.toFixed(2)}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground">K{b.amount.toFixed(2)}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${st.cls}`}>
                    <Icon className="w-3 h-3" />{b.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
