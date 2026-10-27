import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import UserControls from "./UserControls";

const ROLE_TABS = [
  { role: Role.PATIENT, label: "Patients" },
  { role: Role.PRACTITIONER, label: "Practitioners" },
  { role: Role.NGO, label: "NGOs" },
  { role: Role.ADMIN, label: "Admins" },
];

const TIER_STYLE: Record<string, string> = {
  FREE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BASIC: "bg-secondary text-foreground border-border",
  PREMIUM: "bg-violet-50 text-violet-700 border-violet-200",
};

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role: roleParam } = await searchParams;
  const role = ROLE_TABS.some((t) => t.role === roleParam) ? roleParam! : Role.PATIENT;

  const [users, counts] = await Promise.all([
    prisma.user.findMany({
      where: { role },
      include: { practitioner: true, ngo: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
  ]);
  const countFor = (r: string) => counts.find((c) => c.role === r)?._count ?? 0;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Users & Classification</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Classify patients into billing tiers for the Policy Guardian, verify practitioner licences, and keep phone numbers current for SMS.
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        {ROLE_TABS.map((t) => (
          <Link
            key={t.role}
            href={`/admin/users?role=${t.role}`}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              role === t.role ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} <span className="text-xs font-normal">({countFor(t.role)})</span>
          </Link>
        ))}
      </div>

      {users.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">No users in this group.</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm">{u.ngo?.name ?? u.name ?? "Unnamed"}</p>
                  {u.role === Role.PATIENT && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${TIER_STYLE[u.tier] ?? ""}`}>{u.tier}</span>
                  )}
                  {u.practitioner && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-foreground">
                      {u.practitioner.specialty} · {u.practitioner.licenseNo}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {u.email?.endsWith("@ussd.saveserve.local") ? "Registered via USSD" : u.email}
                  {" · "}
                  {u.phone ?? "no phone"}
                  {" · joined "}
                  {formatDate(u.createdAt)}
                </p>
              </div>
              <UserControls
                user={{
                  id: u.id,
                  role: u.role,
                  tier: u.tier,
                  phone: u.phone,
                  isVerified: u.practitioner ? u.practitioner.isVerified : undefined,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
