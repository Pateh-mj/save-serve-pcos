import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users, CalendarDays, Heart, CreditCard } from "lucide-react";
import { AppointmentStatus, BillingStatus, Channel, Role } from "@/lib/constants";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata = { title: "Admin Dashboard" };

/** Zero-filled counts for every known key, so empty categories still show. */
function tally(keys: readonly string[], counts: [string, number][]) {
  const out: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const [key, count] of counts) out[key] = count;
  return out;
}

export default async function AdminDashboard() {
  // Layout already gates on ADMIN; checked again here so the page is safe on its own
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) redirect("/login");

  const [usersByRole, apptsByStatus, apptsByChannel, subsidyAgg, fundAgg] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.appointment.groupBy({ by: ["status"], _count: true }),
    prisma.appointment.groupBy({ by: ["channel"], _count: true }),
    prisma.billing.aggregate({
      where: { status: BillingStatus.SUBSIDIZED },
      _sum: { subsidyAmount: true },
      _count: true,
    }),
    prisma.nGO.aggregate({ _sum: { fundBalance: true }, _count: true }),
  ]);

  const roles = tally(Object.values(Role), usersByRole.map((r) => [r.role, r._count]));
  const statuses = tally(Object.values(AppointmentStatus), apptsByStatus.map((r) => [r.status, r._count]));
  const channels = tally(Object.values(Channel), apptsByChannel.map((r) => [r.channel, r._count]));

  const totalUsers = Object.values(roles).reduce((a, b) => a + b, 0);
  const totalAppts = Object.values(statuses).reduce((a, b) => a + b, 0);
  const subsidyDisbursed = subsidyAgg._sum.subsidyAmount ?? 0;
  const fundBalance = fundAgg._sum.fundBalance ?? 0;

  const stats = [
    { label: "Total Users", value: `${totalUsers}`, icon: Users, sub: "All roles" },
    { label: "Appointments", value: `${totalAppts}`, icon: CalendarDays, sub: "Web + USSD" },
    { label: "Subsidy Disbursed", value: `ZMW ${subsidyDisbursed.toFixed(2)}`, icon: Heart, sub: `${subsidyAgg._count} subsidised visits` },
    { label: "NGO Fund Balance", value: `ZMW ${fundBalance.toFixed(2)}`, icon: CreditCard, sub: `Across ${fundAgg._count} NGO pool${fundAgg._count === 1 ? "" : "s"}` },
  ];

  const breakdowns = [
    { title: "Users by Role", rows: Object.entries(roles) },
    { title: "Appointments by Status", rows: Object.entries(statuses) },
    { title: "Appointments by Channel", rows: Object.entries(channels) },
  ];

  return (
    <div className="max-w-6xl">
      <PageHeader title="System Overview" description="Platform-wide usage and Robin Hood subsidy totals" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <s.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {breakdowns.map((b) => (
          <div key={b.title} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-foreground mb-3">{b.title}</h2>
            <dl className="space-y-2">
              {b.rows.map(([key, count]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground capitalize">{key.toLowerCase()}</dt>
                  <dd className="font-semibold text-foreground tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
