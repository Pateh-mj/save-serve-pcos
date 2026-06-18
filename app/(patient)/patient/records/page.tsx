import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export default async function RecordsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const patient = await prisma.patient.findFirst({
    where: { user: { email: session.user.email } },
    include: {
      ehrRecords: {
        orderBy: { createdAt: "desc" },
        include: { practitioner: { include: { user: true } } },
      },
    },
  });

  if (!patient) redirect("/login");

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Health Records</h1>
          <p className="text-sm text-muted-foreground mt-1">Your complete visit history and clinical notes</p>
        </div>
      </div>

      {patient.ehrRecords.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
          <p className="font-semibold text-foreground">No health ehrRecords yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Records are created by practitioners after each completed visit.</p>
          <Link href="/patient/appointments/new" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90">
            Book an Appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {patient.ehrRecords.map((r) => (
            <div key={r.id} className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">{r.practitioner.user.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-ZM", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</p>
                </div>
                <span className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full font-semibold">
                  Visit
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
