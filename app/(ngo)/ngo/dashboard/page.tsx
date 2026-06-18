import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Heart, Users, BarChart3, CreditCard } from "lucide-react";

export default async function NGODashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const ngo = await prisma.nGO.findFirst({
    where: { user: { email: session.user.email } },
  });

  if (!ngo) redirect("/login");

  const stats = [
    { label: "Fund Balance", value: `K${ngo.fundBalance.toFixed(2)}`, icon: CreditCard, sub: "Available to disburse" },
    { label: "Beneficiaries", value: "—", icon: Users, sub: "Managed by your org" },
    { label: "Disbursed This Month", value: "K0.00", icon: Heart, sub: "Robin Hood contributions" },
    { label: "Impact Score", value: "—", icon: BarChart3, sub: "Appointments funded" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-foreground">{ngo.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">NGO Dashboard</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <s.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 text-center">
        <Heart className="w-10 h-10 text-primary mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="text-lg font-bold text-foreground mb-2">Robin Hood Model Active</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Premium patient subscriptions flow into your subsidy pool. Top up the pool here to fund free-tier appointments for your beneficiaries.
        </p>
      </div>
    </div>
  );
}
