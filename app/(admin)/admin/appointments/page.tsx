import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus, Channel } from "@/lib/constants";
import { TriageLevel } from "@/lib/triage";
import { formatDateTime } from "@/lib/format";
import CancelAppointmentButton from "@/app/(patient)/patient/appointments/CancelAppointmentButton";

export const metadata = { title: "Appointments" };

const FILTERS = {
  status: Object.values(AppointmentStatus) as string[],
  channel: Object.values(Channel) as string[],
  triage: Object.values(TriageLevel) as string[],
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-warning-soft text-warning-fg border-warning-border",
  CONFIRMED: "bg-info-soft text-info-fg border-info-border",
  COMPLETED: "bg-success-soft text-success-fg border-success-border",
  CANCELLED: "bg-danger-soft text-danger-fg border-danger-border",
};

const TRIAGE_STYLE: Record<string, string> = {
  EMERGENCY: "text-danger-fg font-bold",
  URGENT: "text-warning-fg font-semibold",
  ROUTINE: "text-muted-foreground",
};

type Search = { status?: string; channel?: string; triage?: string };

function filterHref(current: Search, key: keyof Search, value: string | undefined) {
  const next = { ...current, [key]: value };
  const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
  return `/admin/appointments${qs ? `?${qs}` : ""}`;
}

export default async function AdminAppointmentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const current: Search = {
    status: FILTERS.status.includes(raw.status ?? "") ? raw.status : undefined,
    channel: FILTERS.channel.includes(raw.channel ?? "") ? raw.channel : undefined,
    triage: FILTERS.triage.includes(raw.triage ?? "") ? raw.triage : undefined,
  };

  const where: Prisma.AppointmentWhereInput = {
    status: current.status,
    channel: current.channel,
    triageLevel: current.triage,
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: "desc" },
      take: 150,
      include: {
        patient: { include: { user: { select: { name: true, phone: true } } } },
        practitioner: { include: { user: { select: { name: true } } } },
        billing: { select: { status: true, discountedAmount: true, amount: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">Appointments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every booking from the web and USSD channels. Showing {appointments.length} of {total}.
        </p>
      </div>

      <div className="space-y-2 mb-6">
        {(Object.keys(FILTERS) as (keyof Search)[]).map((key) => (
          <div key={key} className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-16">{key}</span>
            {[undefined, ...FILTERS[key]].map((value) => {
              const active = current[key] === value;
              return (
                <Link
                  key={value ?? "all"}
                  href={filterHref(current, key, value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary"
                  }`}
                >
                  {value ?? "All"}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {appointments.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">No appointments match these filters.</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-3 py-3 font-semibold">Patient</th>
                <th className="px-3 py-3 font-semibold">Practitioner</th>
                <th className="px-3 py-3 font-semibold">Channel</th>
                <th className="px-3 py-3 font-semibold">Triage</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold text-right">Bill</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((a) => {
                const active = a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED;
                return (
                  <tr key={a.id} className="align-middle">
                    <td className="px-5 py-2.5 whitespace-nowrap text-foreground">{formatDateTime(a.scheduledAt)}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-foreground">{a.patient.user.name}</p>
                      <p className="text-xs text-muted-foreground">{a.patient.user.phone ?? ""}</p>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{a.practitioner.user.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{a.channel}</td>
                    <td className={`px-3 py-2.5 text-xs ${TRIAGE_STYLE[a.triageLevel] ?? ""}`}>{a.triageLevel}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[a.status] ?? ""}`}>{a.status}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {a.billing ? (
                        <>
                          <p className="font-semibold text-foreground tabular-nums">
                            ZMW {(a.billing.discountedAmount ?? a.billing.amount).toFixed(2)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{a.billing.status}</p>
                        </>
                      ) : (
                        <span className="text-xs text-danger">missing</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right">{active && <CancelAppointmentButton appointmentId={a.id} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
