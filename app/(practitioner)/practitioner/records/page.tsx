import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { formatDate } from "@/lib/format";

export default async function PractitionerRecordsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const practitioner = await prisma.practitioner.findUnique({
    where: { userId: session.user.id },
    include: {
      ehrRecords: {
        orderBy: { visitDate: "desc" },
        include: { patient: { include: { user: true } } },
      },
    },
  });

  if (!practitioner) redirect("/login");

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-foreground">EHR Records</h1>
        <p className="text-sm text-muted-foreground mt-1">Clinical records you have authored</p>
      </div>

      {practitioner.ehrRecords.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
          <p className="font-semibold text-foreground">No records yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Records are created when you complete a consultation from the dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {practitioner.ehrRecords.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">{r.patient.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(r.visitDate, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <span className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full font-semibold">
                  {r.appointmentId ? "Visit" : "Note"}
                </span>
              </div>
              {r.diagnosis && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Diagnosis</p>
                  <p className="text-sm text-foreground">{r.diagnosis}</p>
                </div>
              )}
              {r.prescription && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Prescription</p>
                  <p className="text-sm text-foreground">{r.prescription}</p>
                </div>
              )}
              {r.notes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{r.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
