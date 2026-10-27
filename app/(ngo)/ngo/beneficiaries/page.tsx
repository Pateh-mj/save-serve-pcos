import { redirect } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { abbreviateName } from "@/lib/ngo";

const SPECIALTY: Record<string, string> = { NURSE: "Nursing", PHARMACIST: "Pharmacy", PHYSIOTHERAPIST: "Physiotherapy" };

export default async function NgoBeneficiariesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ngo = await prisma.nGO.findUnique({ where: { userId: session.user.id } });
  if (!ngo) redirect("/login");

  const visits = await prisma.billing.findMany({
    where: { ngoId: ngo.id, status: BillingStatus.SUBSIDIZED },
    include: {
      patient: { include: { user: { select: { name: true } } } },
      appointment: { include: { practitioner: { select: { specialty: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const beneficiaries = new Set(visits.map((v) => v.patientId)).size;
  const total = visits.reduce((sum, v) => sum + (v.subsidyAmount ?? 0), 0);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Beneficiaries</h1>
        <p className="text-sm text-muted-foreground mt-1">Visits paid for from your fund.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Funded visits", value: `${visits.length}` },
          { label: "Beneficiaries", value: `${beneficiaries}` },
          { label: "Subsidy value", value: `ZMW ${total.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{s.label}</p>
            <p className="text-2xl font-extrabold text-foreground tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary rounded-xl px-4 py-3 mb-6">
        <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Patient identities are abbreviated and no clinical details are shared with funding partners.
      </p>

      {visits.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No visits have been funded from your pool yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-5 py-3 font-semibold">Beneficiary</th>
                <th className="px-3 py-3 font-semibold">Service</th>
                <th className="px-3 py-3 font-semibold">Visit date</th>
                <th className="px-3 py-3 font-semibold">Visit status</th>
                <th className="px-5 py-3 font-semibold text-right">Subsidy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visits.map((v) => (
                <tr key={v.id}>
                  <td className="px-5 py-2.5 font-medium text-foreground">{abbreviateName(v.patient.user.name)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{SPECIALTY[v.appointment.practitioner.specialty] ?? v.appointment.practitioner.specialty}</td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{formatDate(v.appointment.scheduledAt)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{v.appointment.status}</td>
                  <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-foreground">ZMW {(v.subsidyAmount ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
