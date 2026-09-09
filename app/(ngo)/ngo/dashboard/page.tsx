import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Heart, Users, BarChart3, CreditCard, ShieldCheck } from "lucide-react";
import NgoTopupModal from "./NgoTopupModal";

export default async function NGODashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const ngo = await prisma.nGO.findFirst({
    where: { user: { email: session.user.email } },
  });

  if (!ngo) redirect("/login");

  const subsidizedBillings = await prisma.billing.findMany({
    where: { subsidyApplied: true },
    include: {
      patient: { include: { user: true } },
      appointment: { include: { practitioner: { include: { user: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const totalFundedVisits = await prisma.billing.count({
    where: { subsidyApplied: true },
  });

  const totalFundedAmount = await prisma.billing.aggregate({
    where: { subsidyApplied: true },
    _sum: { amount: true },
  });

  const stats = [
    { label: "Available Subsidy Fund", value: `ZMW ${ngo.fundBalance.toFixed(2)}`, icon: CreditCard, sub: "Ready for low-income patients" },
    { label: "Free Consultations Funded", value: `${totalFundedVisits}`, icon: Users, sub: "Community beneficiaries" },
    { label: "Total Subsidy Value", value: `ZMW ${(totalFundedAmount._sum.amount ?? 0).toFixed(2)}`, icon: Heart, sub: "Direct healthcare impact" },
    { label: "Policy Model", value: "Robin Hood", icon: BarChart3, sub: "Closed-loop cross-subsidies" },
  ];

  return (
    <div className="p-8 max-w-5xl">
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
              When premium patients book consultations, surplus tariffs automatically route into this fund pool. 
              The Policy Guardian consumes this balance to offer 100% free healthcare appointments to Free-tier and vulnerable patients across Zambia.
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
                  <p className="font-semibold text-foreground text-sm">{b.patient.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Consulted: {b.appointment.practitioner.user.name} ({b.appointment.practitioner.specialty})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">ZMW {b.amount.toFixed(2)} Subsidised</p>
                  <p className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString("en-ZM")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
