import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, CalendarDays, HeartHandshake, Wallet, CheckCircle2, XCircle, Info, Globe, Smartphone, Star,
  Clock, CircleCheckBig, Activity,
} from "lucide-react";
import { AppointmentStatus, BillingStatus, Role } from "@/lib/constants";
import { getEvaluationReport } from "@/lib/evaluation";
import { weeklyBuckets, weeksAgo } from "@/lib/chart-data";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Panel } from "@/components/app/Panel";
import { BarChart } from "@/components/charts/BarChart";
import { SegmentBar } from "@/components/charts/SegmentBar";

export const metadata = { title: "Admin Dashboard" };

const zmw = (n: number) => `ZMW ${n.toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function AdminDashboard() {
  // Layout already gates on ADMIN; checked again here so the page is safe on its own
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) redirect("/login");

  const since = weeksAgo(8);
  const [usersByRole, patientsByTier, apptsByStatus, apptsByChannel, recentAppts, subsidyAgg, fundAgg, report] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.user.groupBy({ by: ["tier"], where: { role: Role.PATIENT }, _count: true }),
    prisma.appointment.groupBy({ by: ["status"], _count: true }),
    prisma.appointment.groupBy({ by: ["channel"], _count: true }),
    prisma.appointment.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, channel: true } }),
    prisma.billing.aggregate({ where: { status: BillingStatus.SUBSIDIZED }, _sum: { subsidyAmount: true }, _count: true }),
    prisma.nGO.aggregate({ _sum: { fundBalance: true }, _count: true }),
    getEvaluationReport(30),
  ]);

  const count = <T extends { _count: number }>(rows: T[], pick: (r: T) => string, key: string) =>
    rows.find((r) => pick(r) === key)?._count ?? 0;
  const role = (r: string) => count(usersByRole, (x) => x.role, r);
  const tier = (t: string) => count(patientsByTier, (x) => x.tier, t);
  const status = (s: string) => count(apptsByStatus, (x) => x.status, s);
  const channel = (c: string) => count(apptsByChannel, (x) => x.channel, c);
  const totalUsers = usersByRole.reduce((a, r) => a + r._count, 0);
  const totalAppts = apptsByStatus.reduce((a, r) => a + r._count, 0);
  const weeks = weeklyBuckets(recentAppts, (a) => a.createdAt, (a) => [a.channel === "WEB" ? 1 : 0, a.channel === "USSD" ? 1 : 0], 8);
  const checks = report.checks.filter((c) => !c.informational);
  const passing = checks.filter((c) => c.passed).length;

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="Administration"
        title="System overview"
        description="Usage across web and USSD, the subsidy pool, and live integrity checks."
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Users" value={totalUsers} icon={Users} tone="info" href="/admin/users"
          hint={`${role(Role.PATIENT)} patients · ${role(Role.PRACTITIONER)} clinicians · ${role(Role.NGO)} partners`} />
        <StatCard label="Appointments" value={totalAppts} icon={CalendarDays} tone="brand" href="/admin/appointments"
          hint={`${channel("USSD")} by USSD · ${channel("WEB")} on the web`} />
        <StatCard label="Subsidy disbursed" value={zmw(subsidyAgg._sum.subsidyAmount ?? 0)} icon={HeartHandshake} tone="success"
          hint={`${subsidyAgg._count} free visits funded`} />
        <StatCard label="Pool balance" value={zmw(fundAgg._sum.fundBalance ?? 0)} icon={Wallet} tone="premium" href="/admin/policies"
          hint={`Across ${fundAgg._count} partner pool${fundAgg._count === 1 ? "" : "s"}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Panel className="lg:col-span-2" title="Bookings per week by channel" description="Last 8 weeks: multi-channel access in practice">
          <BarChart
            title="Bookings per week by channel"
            data={weeks}
            series={[{ name: "Web", color: "var(--chart-1)" }, { name: "USSD", color: "var(--chart-2)" }]}
            height={190}
          />
        </Panel>

        <Panel
          title="System health"
          description="Data and ledger integrity, checked live"
          action={<Link href="/admin/evaluation" className="text-sm font-medium text-primary hover:underline">Details</Link>}
        >
          <p className={`text-3xl font-bold ${passing === checks.length ? "text-success-fg" : "text-danger-fg"}`}>
            {passing}/{checks.length}
          </p>
          <p className="text-sm text-muted-foreground mb-4">checks passing</p>
          <ul className="space-y-2.5">
            {report.checks.map((c) => (
              <li key={c.name} className="flex items-start gap-2 text-sm">
                {c.informational ? (
                  <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
                ) : c.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                )}
                <span className="text-foreground">{c.name}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Patients by tier" description="Who the Policy Guardian subsidises">
          <SegmentBar
            title="Patients by billing tier"
            segments={[
              { label: "Free (subsidised)", value: tier("FREE"), color: "var(--chart-1)", icon: HeartHandshake },
              { label: "Basic", value: tier("BASIC"), color: "var(--chart-2)" },
              { label: "Premium", value: tier("PREMIUM"), color: "var(--chart-3)", icon: Star },
            ]}
          />
        </Panel>
        <Panel title="Appointments by status">
          <SegmentBar
            title="Appointments by status"
            segments={[
              { label: "Pending", value: status(AppointmentStatus.PENDING), color: "var(--warning)", icon: Clock },
              { label: "Confirmed", value: status(AppointmentStatus.CONFIRMED), color: "var(--info)", icon: CheckCircle2 },
              { label: "Completed", value: status(AppointmentStatus.COMPLETED), color: "var(--success)", icon: CircleCheckBig },
              { label: "Cancelled", value: status(AppointmentStatus.CANCELLED), color: "var(--chart-axis)", icon: XCircle },
            ]}
          />
        </Panel>
        <Panel title="Channel mix" description="All bookings to date">
          <SegmentBar
            title="Bookings by channel"
            segments={[
              { label: "Web", value: channel("WEB"), color: "var(--chart-1)", icon: Globe },
              { label: "USSD *384#", value: channel("USSD"), color: "var(--chart-2)", icon: Smartphone },
            ]}
          />
          <p className="mt-4 text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Response times and satisfaction are on the Evaluation page.
          </p>
        </Panel>
      </div>
    </div>
  );
}
