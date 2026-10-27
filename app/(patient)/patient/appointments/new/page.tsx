"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, CalendarDays, Clock, AlertTriangle, Stethoscope,
  CheckCircle2, Loader2, ArrowLeft, CreditCard,
} from "lucide-react";
import { clinicDateKey } from "@/lib/format";
import {
  assessTriage, DANGER_SIGN_CODES, ROUTINE_SYMPTOM_CODES, SYMPTOMS, TriageLevel,
} from "@/lib/triage";

const TRIAGE_STYLE: Record<string, string> = {
  [TriageLevel.EMERGENCY]: "bg-danger-soft text-danger-fg border-danger-border",
  [TriageLevel.URGENT]: "bg-warning-soft text-warning-fg border-warning-border",
  [TriageLevel.ROUTINE]: "bg-success-soft text-success-fg border-success-border",
};

const DURATIONS = [
  { label: "Today", days: 0 },
  { label: "1–3 days", days: 2 },
  { label: "4–7 days", days: 5 },
  { label: "Over a week", days: 8 },
];

const SEVERITIES = [
  { label: "Mild", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "Severe", value: 3 },
];

type Quote = { finalAmount: number; status: string; explanation: string; tier: string };
type Booked = { id: string; triageLevel: string; billingExplanation: string; billing: { discountedAmount: number | null; amount: number } | null };

type Practitioner = {
  id: string;
  specialty: string;
  location: string | null;
  bio: string | null;
  isVerified: boolean;
  user: { name: string | null };
};

const SPECIALTY_LABEL: Record<string, string> = {
  NURSE: "Nurse", PHARMACIST: "Pharmacist", PHYSIOTHERAPIST: "Physiotherapist",
};

type Slot = { iso: string; label: string };

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("practitionerId");

  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedId, setSelectedId] = useState(preselectedId ?? "");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotIso, setSlotIso] = useState("");
  const [notes, setNotes] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState(0);
  const [severity, setSeverity] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<Booked | null>(null);

  // Same rules the server applies; shown live so the patient sees their priority
  const triage = assessTriage({ symptoms, durationDays, severity });

  function toggleSymptom(code: string) {
    setSymptoms((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  useEffect(() => {
    fetch("/api/practitioners")
      .then((r) => r.json())
      .then(setPractitioners)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setQuote(null);
    if (!selectedId) return;
    fetch(`/api/billing/quote?practitionerId=${selectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setQuote)
      .catch(() => {});
  }, [selectedId]);

  async function loadSlots(practitionerId: string, day: string) {
    setSlotIso("");
    setSlots([]);
    if (!practitionerId || !day) return;
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/practitioners/${practitionerId}/slots?date=${day}`);
      const data = await res.json();
      setSlots(res.ok ? data.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  useEffect(() => {
    loadSlots(selectedId, date);
  }, [selectedId, date]);

  const selected = practitioners.find((p) => p.id === selectedId);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !date || !slotIso) { setError("Please select a practitioner, date and time."); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ practitionerId: selectedId, scheduledAt: slotIso, notes, symptoms, durationDays, severity }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Booking failed.");
      setLoading(false);
      // Slot may have just been taken — refresh the list
      if (res.status === 409) loadSlots(selectedId, date);
      return;
    }

    setBooked(data);
  }

  if (booked) {
    const fee = booked.billing?.discountedAmount ?? booked.billing?.amount ?? 0;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Appointment Booked</h2>
        <p className="text-sm text-muted-foreground mb-6">Reference {booked.id.slice(-6).toUpperCase()} · an SMS confirmation is on its way</p>
        <div className="w-full bg-card border border-border rounded-xl p-5 text-left text-sm space-y-2 mb-6">
          <p className="flex justify-between"><span className="text-muted-foreground">Priority</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TRIAGE_STYLE[booked.triageLevel] ?? ""}`}>{booked.triageLevel}</span>
          </p>
          <p className="flex justify-between"><span className="text-muted-foreground">You pay</span>
            <span className="font-bold text-foreground">ZMW {fee.toFixed(2)}</span>
          </p>
          <p className="text-xs text-muted-foreground pt-1 border-t border-border">{booked.billingExplanation}</p>
        </div>
        {booked.triageLevel === TriageLevel.EMERGENCY && (
          <p className="w-full text-sm text-danger-fg bg-danger-soft border border-danger-border rounded-xl px-4 py-3 mb-6 text-left">
            You reported danger signs. Do not wait for this appointment if you feel worse: call 991 or go to the nearest health facility now.
          </p>
        )}
        <button
          onClick={() => router.push("/patient/appointments")}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90"
        >
          View my appointments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/patient/dashboard" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Book an Appointment</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Select a practitioner and a time slot.</p>
        </div>
      </div>

      <form onSubmit={handleBook} className="space-y-6">
        {/* Symptom triage */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-bold text-foreground mb-1 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
            What brings you in?
          </h2>
          <p className="text-xs text-muted-foreground mb-4 ml-8">
            Triage helps the practitioner see the most urgent patients first. It is not a diagnosis.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {ROUTINE_SYMPTOM_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => toggleSymptom(code)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  symptoms.includes(code)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary"
                }`}
              >
                {SYMPTOMS[code].label}
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold text-danger-fg mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Danger signs
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {DANGER_SIGN_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => toggleSymptom(code)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  symptoms.includes(code)
                    ? "bg-danger text-white border-danger"
                    : "bg-background text-danger-fg border-danger-border hover:border-danger-border-strong"
                }`}
              >
                {SYMPTOMS[code].label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-xs font-medium text-foreground mb-1.5">Unwell for</p>
              <div className="flex flex-wrap gap-1.5">
                {DURATIONS.map((d) => (
                  <button key={d.label} type="button" onClick={() => setDurationDays(d.days)}
                    className={`px-2.5 py-1 rounded-lg text-xs border ${durationDays === d.days ? "bg-secondary border-primary text-foreground font-semibold" : "border-border text-muted-foreground"}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-1.5">How bad is it?</p>
              <div className="flex flex-wrap gap-1.5">
                {SEVERITIES.map((s) => (
                  <button key={s.value} type="button" onClick={() => setSeverity(s.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs border ${severity === s.value ? "bg-secondary border-primary text-foreground font-semibold" : "border-border text-muted-foreground"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${TRIAGE_STYLE[triage.level]}`}>
            <Stethoscope className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Priority: {triage.level}</p>
              <p className="text-xs mt-0.5">{triage.advice}</p>
            </div>
          </div>
        </div>

        {/* Practitioner selection */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
            Select Practitioner
          </h2>

          {practitioners.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading practitioners…</p>
          ) : (
            <div className="grid gap-3">
              {practitioners.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    selectedId === p.id
                      ? "border-primary bg-secondary"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    {p.user.name?.[0]?.toUpperCase() ?? "P"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm">{p.user.name}</p>
                      {p.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {SPECIALTY_LABEL[p.specialty]}
                      {p.location && ` · ${p.location}`}
                    </p>
                  </div>
                  {selectedId === p.id && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date & time */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
            Choose Date & Time
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <CalendarDays className="w-4 h-4 inline mr-1.5" />Date
              </label>
              <input
                type="date"
                min={clinicDateKey()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Clock className="w-4 h-4 inline mr-1.5" />Time slot
              </label>
              {!selectedId || !date ? (
                <p className="text-sm text-muted-foreground">Select a practitioner and date to see open slots.</p>
              ) : slotsLoading ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading available slots…
                </p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open slots on this day. The practitioner may not work this day, or all slots are booked.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.iso}
                      type="button"
                      onClick={() => setSlotIso(s.iso)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        slotIso === s.iso
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">4</span>
            Additional Notes <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </h2>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe your symptoms or reason for visit…"
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
          />
        </div>

        {/* Policy Guardian fee preview */}
        {selected && (
          <div className="flex items-start gap-3 px-4 py-3 bg-secondary rounded-xl text-sm">
            <CreditCard className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            {quote ? (
              <div className="text-secondary-foreground">
                <p className="font-semibold text-foreground">
                  You will pay ZMW {quote.finalAmount.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">({quote.tier} tier)</span>
                </p>
                <p className="text-xs mt-0.5">{quote.explanation}</p>
              </div>
            ) : (
              <span className="text-secondary-foreground">Policy Guardian is calculating your fee…</span>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-60 transition"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Booking…" : "Confirm Appointment"}
        </button>
      </form>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense>
      <BookingForm />
    </Suspense>
  );
}
