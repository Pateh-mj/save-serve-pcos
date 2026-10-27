import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clinicDateKey, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel } from "@/components/app/Panel";
import { BarChart } from "@/components/charts/BarChart";

export const metadata = { title: "Impact Report" };

const MONTHS = 6;

type Month = { key: string; visits: number; subsidy: number; refunds: number; premium: number; topups: number };

async function loadMonthlyImpact(ngoId: string) {
  // First day of the month MONTHS-1 months ago, Zambian time
  const [y, m] = clinicDateKey().split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1 - (MONTHS - 1), 1) - 2 * 3_600_000);

  const rows = await prisma.fundTransaction.findMany({
    where: { ngoId, createdAt: { gte: start }, type: { not: "OPENING" } },
    select: { type: true, amount: true, createdAt: true },
  });

  const months: Month[] = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (MONTHS - 1 - i), 15));
    return { key: d.toISOString().slice(0, 7), visits: 0, subsidy: 0, refunds: 0, premium: 0, topups: 0 };
  });

  for (const r of rows) {
    const month = months.find((mo) => mo.key === clinicDateKey(r.createdAt).slice(0, 7));
    if (!month) continue;
    if (r.type === "SUBSIDY_DEBIT") {
      month.visits += 1;
      month.subsidy += -r.amount;
    } else if (r.type === "SUBSIDY_REFUND") {
      month.visits -= 1;
      month.refunds += r.amount;
      month.subsidy -= r.amount;
    } else if (r.type === "PREMIUM_CREDIT") {
      month.premium += r.amount;
    } else if (r.type === "TOPUP") {
      month.topups += r.amount;
    }
  }
  return months.reverse();
}

export default async function NgoImpactPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ngo = await prisma.nGO.findUnique({ where: { userId: session.user.id } });
  if (!ngo) redirect("/login");

  const months = await loadMonthlyImpact(ngo.id);
  const totals = months.reduce(
    (t, mo) => ({ visits: t.visits + mo.visits, subsidy: t.subsidy + mo.subsidy, premium: t.premium + mo.premium, topups: t.topups + mo.topups }),
    { visits: 0, subsidy: 0, premium: 0, topups: 0 }
  );
  const internalShare = totals.premium + totals.topups > 0 ? totals.premium / (totals.premium + totals.topups) : 0;

  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow="Impact" title="Impact report" description={<>The last {MONTHS} months of your fund, from the ledger. Net of cancellations, which return their subsidy to the fund.</>} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Visits funded", value: `${totals.visits}` },
          { label: "Subsidy disbursed", value: `ZMW ${totals.subsidy.toFixed(2)}` },
          { label: "Premium surplus received", value: `ZMW ${totals.premium.toFixed(2)}` },
          { label: "Funded internally", value: `${(internalShare * 100).toFixed(0)}%`, sub: "Premium surplus as a share of all money in" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <p className="text-sm font-medium text-muted-foreground mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
            {s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      <Panel title="Money into the pool by source" description="Premium surplus is the Robin Hood share: care for some, funded by others" className="mb-6">
        <BarChart
          title="Money into the pool per month by source"
          unit="zmw"
          data={months.map((mo) => ({ label: formatDate(`${mo.key}-15T12:00:00Z`, { month: "short" }), values: [mo.topups, mo.premium] }))}
          series={[{ name: "Partner top-ups", color: "var(--chart-1)" }, { name: "Premium surplus", color: "var(--chart-2)" }]}
          height={170}
        />
      </Panel>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/60 border-b border-border">
              <th className="px-5 py-3 font-semibold">Month</th>
              <th className="px-3 py-3 font-semibold text-right">Visits funded</th>
              <th className="px-3 py-3 font-semibold text-right">Subsidy disbursed</th>
              <th className="px-3 py-3 font-semibold text-right">Premium surplus in</th>
              <th className="px-5 py-3 font-semibold text-right">Top-ups</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {months.map((mo) => (
              <tr key={mo.key}>
                <td className="px-5 py-2.5 font-medium text-foreground">
                  {formatDate(`${mo.key}-15T12:00:00Z`, { month: "long", year: "numeric" })}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{mo.visits}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">ZMW {mo.subsidy.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">ZMW {mo.premium.toFixed(2)}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">ZMW {mo.topups.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="font-semibold bg-secondary/50">
              <td className="px-5 py-2.5 text-foreground">Total</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{totals.visits}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">ZMW {totals.subsidy.toFixed(2)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">ZMW {totals.premium.toFixed(2)}</td>
              <td className="px-5 py-2.5 text-right tabular-nums">ZMW {totals.topups.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
