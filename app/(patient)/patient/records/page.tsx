import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Pill, NotebookPen, CalendarClock, Stethoscope } from "lucide-react";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/app/PageHeader";
import { Panel, EmptyState } from "@/components/app/Panel";
import { btnPrimary } from "@/components/app/buttons";

export const metadata = { title: "Health Records" };

export default async function RecordsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const patient = await prisma.patient.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      ehrRecords: {
        orderBy: { visitDate: "desc" },
        include: { practitioner: { include: { user: true } } },
      },
    },
  });
  if (!patient) redirect("/login");
  const records = patient.ehrRecords;

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Health records"
        title="My clinical history"
        description="Written by your practitioner after each visit. Also available by USSD: dial *384# and choose 3."
      />

      {records.length === 0 ? (
        <Panel>
          <EmptyState
            icon={FileText}
            title="No health records yet"
            action={<Link href="/patient/appointments/new" className={btnPrimary}>Book a visit</Link>}
          >
            A record is created when a practitioner completes your visit.
          </EmptyState>
        </Panel>
      ) : (
        <ol className="relative border-l-2 border-border ml-3 space-y-6">
          {records.map((r) => (
            <li key={r.id} className="relative pl-8">
              <span aria-hidden className="absolute -left-2.75 top-5 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-primary" />
              </span>
              <article className="bg-card border border-border rounded-xl shadow-xs">
                <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-border">
                  <div>
                    <p className="font-semibold text-foreground">
                      {formatDate(r.visitDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5" /> {r.practitioner.user.name}
                      <span className="capitalize">· {r.practitioner.specialty.toLowerCase()}</span>
                    </p>
                  </div>
                  {r.followUpDate && (
                    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-info-soft border border-info-border text-xs font-semibold text-info-fg">
                      <CalendarClock className="w-3.5 h-3.5" /> Follow-up {formatDate(r.followUpDate, { day: "numeric", month: "short" })}
                    </span>
                  )}
                </header>
                <dl className="px-5 py-4 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Diagnosis</dt>
                    <dd className="text-foreground font-medium">{r.diagnosis ?? "Not recorded"}</dd>
                  </div>
                  {r.prescription && (
                    <div className="flex gap-3 rounded-lg bg-info-soft border border-info-border p-3">
                      <Pill className="w-4 h-4 text-info shrink-0 mt-0.5" />
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-info-fg mb-0.5">Prescription &amp; treatment</dt>
                        <dd className="text-info-deep">{r.prescription}</dd>
                      </div>
                    </div>
                  )}
                  {r.notes && (
                    <div className="flex gap-3">
                      <NotebookPen className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Advice</dt>
                        <dd className="text-foreground">{r.notes}</dd>
                      </div>
                    </div>
                  )}
                </dl>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
