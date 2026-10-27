import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Phone, CalendarDays, ChevronRight } from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";

import { PageHeader } from "@/components/app/PageHeader";

export const metadata = { title: "Patients" };

export default async function PractitionerPatientsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const practitioner = await prisma.practitioner.findUnique({
    where: { userId: session.user.id },
    include: {
      appointments: {
        where: { status: { not: AppointmentStatus.CANCELLED } },
        orderBy: { scheduledAt: "desc" },
        include: { patient: { include: { user: true } } },
      },
    },
  });

  if (!practitioner) redirect("/login");

  // One row per patient; appointments are newest-first so the first seen wins for "last"
  const now = new Date();
  const byPatient = new Map<
    string,
    {
      name: string | null;
      phone: string | null;
      completedVisits: number;
      lastVisit: Date | null;
      nextVisit: Date | null;
    }
  >();

  for (const a of practitioner.appointments) {
    const row = byPatient.get(a.patientId) ?? {
      name: a.patient.user.name,
      phone: a.patient.user.phone,
      completedVisits: 0,
      lastVisit: null,
      nextVisit: null,
    };
    if (a.status === AppointmentStatus.COMPLETED) {
      row.completedVisits += 1;
      row.lastVisit ??= a.scheduledAt;
    } else if (a.scheduledAt >= now) {
      // Iterating newest-first, so keep overwriting to end on the soonest upcoming visit
      row.nextVisit = a.scheduledAt;
    }
    byPatient.set(a.patientId, row);
  }

  const patients = Array.from(byPatient.entries());

  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow="Patients" title="My Patients" description={<>{patients.length} patient{patients.length === 1 ? "" : "s"} booked with you across Web and USSD</>} />

      {patients.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
          <p className="font-semibold text-foreground text-lg">No patients yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Patients appear here once they book a consultation with you.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map(([id, p]) => (
            <Link
              key={id}
              href={`/practitioner/patients/${id}`}
              className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4 hover:border-primary/40 hover:shadow-md transition"
            >
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                {p.name?.[0]?.toUpperCase() ?? "P"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{p.name ?? "Unnamed patient"}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-3">
                  {p.phone && (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Phone className="w-3 h-3" /> {p.phone}
                    </span>
                  )}
                  <span>
                    Last visit:{" "}
                    <span className="font-semibold text-foreground">
                      {p.lastVisit ? formatDate(p.lastVisit) : "No completed visit yet"}
                    </span>
                  </span>
                  {p.nextVisit && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> Next: {formatDateTime(p.nextVisit)}
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full font-semibold shrink-0">
                {p.completedVisits} visit{p.completedVisits === 1 ? "" : "s"}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
