"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, FileText, Loader2, Stethoscope } from "lucide-react";
import { AppointmentStatus } from "@/lib/constants";

interface Props {
  appointment: {
    id: string;
    status: string;
    patientId: string;
    patient: {
      user: {
        name: string | null;
      };
    };
    ehrRecord?: {
      id: string;
    } | null;
  };
}

export default function PractitionerAppointmentActions({ appointment }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showEhrModal, setShowEhrModal] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          status: newStatus,
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to update status.");
      }
    } catch (e) {
      console.error(e);
      alert("Error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteEhr(e: React.FormEvent) {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert("Please enter a diagnosis.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/ehr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          diagnosis,
          prescription,
          notes,
        }),
      });

      if (res.ok) {
        setShowEhrModal(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to save EHR record.");
      }
    } catch (e) {
      console.error(e);
      alert("Error creating EHR record.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {appointment.status === AppointmentStatus.PENDING && (
          <>
            <button
              onClick={() => updateStatus(AppointmentStatus.CONFIRMED)}
              disabled={loading}
              className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5 transition"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Accept Visit
            </button>
            <button
              onClick={() => updateStatus(AppointmentStatus.CANCELLED)}
              disabled={loading}
              className="px-3 py-2 bg-destructive/10 text-destructive text-xs font-semibold rounded-xl hover:bg-destructive/20 disabled:opacity-60 flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" /> Decline
            </button>
          </>
        )}

        {appointment.status === AppointmentStatus.CONFIRMED && (
          <button
            onClick={() => setShowEhrModal(true)}
            disabled={loading}
            className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5 transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" /> Complete Consultation & EHR
          </button>
        )}

        {appointment.status === AppointmentStatus.COMPLETED && !appointment.ehrRecord && (
          <button
            onClick={() => setShowEhrModal(true)}
            disabled={loading}
            className="px-3 py-1.5 bg-secondary text-foreground text-xs font-semibold rounded-lg hover:bg-muted flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5 text-primary" /> Add EHR Record
          </button>
        )}
      </div>

      {/* EHR Clinical Record Authoring Modal */}
      {showEhrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Record Clinical Consultation</h3>
                  <p className="text-xs text-muted-foreground">Patient: {appointment.patient.user.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEhrModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteEhr} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Clinical Diagnosis *
                </label>
                <textarea
                  required
                  rows={2}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute bronchitis; mild dehydration; stable vitals."
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Prescription & Treatment Plan
                </label>
                <textarea
                  rows={2}
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg TDS x 5 days; ORS sachets."
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Clinical Notes / Follow-up Advice
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Patient advised to return for follow-up if symptoms persist after 3 days."
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEhrModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 disabled:opacity-60 flex items-center gap-2 shadow-sm"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit EHR & Mark Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
