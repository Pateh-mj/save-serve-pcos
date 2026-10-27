import { prisma } from "@/lib/prisma";
import { getConsultationFee } from "@/lib/settings";
import { FeeEditor, PolicyEditor } from "./PolicyEditor";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata = { title: "Policy Guardian" };

const TIER_ORDER: Record<string, number> = { FREE: 0, BASIC: 1, PREMIUM: 2 };

function maxVisits(rules: string): number | null {
  try {
    const v = JSON.parse(rules)?.maxVisitsPerMonth;
    return typeof v === "number" ? v : null;
  } catch {
    return null;
  }
}

export default async function AdminPoliciesPage() {
  const [policies, fee] = await Promise.all([prisma.policy.findMany(), getConsultationFee()]);
  policies.sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9));

  return (
    <div className="max-w-4xl">
      <PageHeader title="Policy Guardian Settings" description="The rules the Policy Guardian applies to every booking, on both Web and USSD. Changes take effect on the next booking;
          existing bills keep the terms they were created with." />

      <div className="bg-card border border-border rounded-xl p-5 shadow-sm mb-6">
        <h2 className="font-bold text-foreground mb-3">Base tariff</h2>
        <FeeEditor fee={fee} />
        <p className="text-xs text-muted-foreground mt-3">
          Each tier pays the base fee × its multiplier. FREE (×0) visits are funded from NGO pools; PREMIUM visits above ×1 pay the
          surplus into the pool when the bill is paid (Robin Hood model).
        </p>
      </div>

      <div className="space-y-4">
        {policies.map((p) => (
          <PolicyEditor
            key={p.id}
            fee={fee}
            policy={{
              id: p.id,
              name: p.name,
              tier: p.tier,
              billingMultiplier: p.billingMultiplier,
              maxVisitsPerMonth: maxVisits(p.rules),
              isActive: p.isActive,
            }}
          />
        ))}
      </div>
    </div>
  );
}
