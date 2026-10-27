"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, FileText, Loader2, Stethoscope } from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";
import { clinicDateKey } from "@/lib/format";
import { toast } from "@/components/app/Toaster";
import { StatusBadge } from "@/components/app/StatusBadge";
import { btnPrimary, btnOutline, textareaCls, inputCls } from "@/components/app/buttons";

interface Props {
  appointment: {
    id: string;
    status: string;
    patientId: string;
    triageLevel?: string;
    /** Human-readable symptom labels, shown as context in the consultation form. */
    symptomList?: string[];
    patient: { user: { name: string | null } };
    ehrRecord?: { id: string } | null;
  };
}

const small = "h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-60";

export default function PractitionerAppointmentActions({ appointment }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showEhr, setShowEhr] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const patientName = appointment.patient.user.name ?? "the patient";

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointment.id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(
          newStatus === AppointmentStatus.CONFIRMED
            ? `Visit confirmed. ${patientName} will get an SMS.`
            : `Visit cancelled. ${patientName} has been notified.`
        );
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not update the visit.");
      }
    } catch {
      toast.error("Network problem: nothing was changed. Please try again.");
    } finally {
      setLoading(false);
      setConfirmCancel(false);
    }
  }

  async function handleCompleteEhr(e: React.FormEvent) {
    e.preventDefault();
    if (!diagnosis.trim()) return toast.error("Enter a diagnosis to complete the visit.");
    setLoading(true);
    try {
      const res = await fetch("/api/ehr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: appointment.patientId, appointmentId: appointment.id, diagnosis, prescription, notes, followUpDate }),
      });
      if (res.ok) {
        setShowEhr(false);
        toast.success(`Consultation recorded for ${patientName}. The visit is now complete.`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Could not save the record.");
      }
    } catch {
      toast.error("Network problem: the record was not saved. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmCancel) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-danger-border bg-danger-soft px-3 py-2">
        <span className="text-xs text-danger-deep">
          {appointment.status === AppointmentStatus.PENDING ? "Decline" : "Cancel"} this visit? Any unpaid bill is waived.
        </span>
        <button onClick={() => updateStatus(AppointmentStatus.CANCELLED)} disabled={loading} className={`${small} bg-danger text-white`}>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Yes
        </button>
        <button onClick={() => setConfirmCancel(false)} disabled={loading} className={`${small} bg-card border border-border text-foreground`}>
          Keep
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {appointment.status === AppointmentStatus.PENDING && (
          <>
            <button onClick={() => updateStatus(AppointmentStatus.CONFIRMED)} disabled={loading} className={`${small} bg-primary text-primary-foreground hover:bg-primary/90`}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept visit
            </button>
            <button onClick={() => setConfirmCancel(true)} disabled={loading} className={`${small} border border-border text-muted-foreground hover:text-danger-fg hover:border-danger-border hover:bg-danger-soft`}>
              <X className="w-3.5 h-3.5" /> Decline
            </button>
          </>
        )}

        {appointment.status === AppointmentStatus.CONFIRMED && (
          <>
            <button onClick={() => setShowEhr(true)} disabled={loading} className={`${small} bg-primary text-primary-foreground hover:bg-primary/90`}>
              <Stethoscope className="w-3.5 h-3.5" /> Start consultation
            </button>
            <button onClick={() => setConfirmCancel(true)} disabled={loading} className={`${small} border border-border text-muted-foreground hover:text-danger-fg hover:border-danger-border hover:bg-danger-soft`}>
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </>
        )}

        {appointment.status === AppointmentStatus.COMPLETED && !appointment.ehrRecord && (
          <button onClick={() => setShowEhr(true)} disabled={loading} className={`${small} border border-border bg-card text-foreground hover:bg-secondary`}>
            <FileText className="w-3.5 h-3.5 text-primary" /> Add clinical record
          </button>
        )}
      </div>

      {showEhr && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/50 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="ehr-title">
          <div className="bg-card w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-xl shadow-2xl">
            <div className="sticky top-0 bg-card flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-lg bg-accent text-primary inline-flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </span>
                <div>
                  <h3 id="ehr-title" className="font-semibold text-foreground">Clinical consultation</h3>
                  <p className="text-sm text-muted-foreground">{patientName}</p>
                </div>
              </div>
              <button onClick={() => setShowEhr(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(appointment.symptomList?.length || appointment.triageLevel) && (
              <div className="mx-6 mt-5 rounded-lg bg-secondary px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Presenting complaint</span>
                  {appointment.triageLevel && <StatusBadge kind="triage" value={appointment.triageLevel} />}
                </div>
                <p className="text-foreground">{appointment.symptomList?.join(", ") || "Not given"}</p>
              </div>
            )}

            <form onSubmit={handleCompleteEhr} className="px-6 py-5 space-y-4">
              <Field label="Diagnosis" required hint="Required to complete the visit">
                <textarea required rows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute bronchitis; mild dehydration; vitals stable." className={textareaCls} />
              </Field>
              <Field label="Prescription and treatment">
                <textarea rows={2} value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="e.g. Amoxicillin 500 mg TDS × 5 days; ORS sachets." className={textareaCls} />
              </Field>
              <Field label="Clinical notes and advice">
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Return if symptoms persist after 3 days." className={textareaCls} />
              </Field>
              <Field label="Follow-up date" hint="Optional. The patient gets an SMS reminder the day before.">
                <input type="date" min={clinicDateKey()} value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={inputCls} />
              </Field>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEhr(false)} className={btnOutline}>Cancel</button>
                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save record &amp; complete visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}
