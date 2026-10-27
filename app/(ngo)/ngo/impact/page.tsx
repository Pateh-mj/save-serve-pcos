import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clinicDateKey, formatDate } from "@/lib/format";

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
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Impact Report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The last {MONTHS} months of your fund, from the ledger. Net of cancellations, which return their subsidy to the fund.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Visits funded", value: `${totals.visits}` },
          { label: "Subsidy disbursed", value: `ZMW ${totals.subsidy.toFixed(2)}` },
          { label: "Premium surplus received", value: `ZMW ${totals.premium.toFixed(2)}` },
          { label: "Funded internally", value: `${(internalShare * 100).toFixed(0)}%`, sub: "Premium surplus as a share of all money in" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{s.label}</p>
            <p className="text-2xl font-extrabold text-foreground tabular-nums">{s.value}</p>
            {s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
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
