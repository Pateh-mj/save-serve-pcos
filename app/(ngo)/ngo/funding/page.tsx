import { redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { LEDGER_LABEL } from "@/lib/ngo";
import { PageHeader } from "@/components/app/PageHeader";
import NgoTopupModal from "../dashboard/NgoTopupModal";

export const metadata = { title: "Funding & Ledger" };

const TYPE_ORDER = ["OPENING", "TOPUP", "PREMIUM_CREDIT", "SUBSIDY_DEBIT", "SUBSIDY_REFUND"];

export default async function NgoFundingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ngo = await prisma.nGO.findUnique({ where: { userId: session.user.id } });
  if (!ngo) redirect("/login");

  const [ledger, byType] = await Promise.all([
    prisma.fundTransaction.findMany({ where: { ngoId: ngo.id }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.fundTransaction.groupBy({ by: ["type"], where: { ngoId: ngo.id }, _sum: { amount: true }, _count: true }),
  ]);
  const ledgerTotal = byType.reduce((sum, t) => sum + (t._sum.amount ?? 0), 0);
  const reconciled = Math.abs(ledgerTotal - ngo.fundBalance) < 0.01;

  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow="Funding" title="Funding &amp; ledger" description={<>Every movement of the community health equity fund held by {ngo.name}.</>} actions={<NgoTopupModal />} />

      <div className="grid md:grid-cols-[1fr_2fr] gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
          <p className="text-sm font-medium text-muted-foreground mb-2">Current balance</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">ZMW {ngo.fundBalance.toFixed(2)}</p>
          <p className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${reconciled ? "text-success-fg" : "text-danger-fg"}`}>
            {reconciled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {reconciled ? "Reconciles with the ledger" : `Ledger total ZMW ${ledgerTotal.toFixed(2)} differs`}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
          <p className="text-sm font-medium text-muted-foreground mb-3">Totals by movement type</p>
          <dl className="space-y-2 text-sm">
            {TYPE_ORDER.map((type) => {
              const row = byType.find((t) => t.type === type);
              const amount = row?._sum.amount ?? 0;
              return (
                <div key={type} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {LEDGER_LABEL[type]} <span className="text-xs">({row?._count ?? 0})</span>
                  </dt>
                  <dd className={`font-semibold tabular-nums ${amount < 0 ? "text-danger" : "text-foreground"}`}>
                    {amount < 0 ? "−" : ""}ZMW {Math.abs(amount).toFixed(2)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>

      <h2 className="font-semibold text-foreground mb-3">Ledger</h2>
      {ledger.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">No fund movements yet.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/60 border-b border-border">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Movement</th>
                <th className="px-3 py-3 font-semibold">Note</th>
                <th className="px-5 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledger.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-2.5 text-muted-foreground whitespace-nowrap">
                    {formatDate(t.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{LEDGER_LABEL[t.type] ?? t.type}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{t.note ?? ""}</td>
                  <td className={`px-5 py-2.5 text-right font-semibold tabular-nums ${t.amount >= 0 ? "text-success-fg" : "text-danger"}`}>
                    {t.amount >= 0 ? "+" : "−"}ZMW {Math.abs(t.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
