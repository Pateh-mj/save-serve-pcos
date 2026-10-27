"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, CalendarDays, Clock, AlertTriangle, Stethoscope,
  CheckCircle2, Loader2, ArrowLeft, CreditCard, MapPin, Siren,
} from "lucide-react";
import { clinicDateKey, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/app/StatusBadge";
import { btnPrimary, btnOutline, inputCls, textareaCls } from "@/components/app/buttons";
import {
  assessTriage, DANGER_SIGN_CODES, ROUTINE_SYMPTOM_CODES, SYMPTOMS, TriageLevel,
} from "@/lib/triage";

const TRIAGE_PANEL: Record<string, string> = {
  [TriageLevel.EMERGENCY]: "bg-danger-soft text-danger-deep border-danger-border",
  [TriageLevel.URGENT]: "bg-warning-soft text-warning-deep border-warning-border",
  [TriageLevel.ROUTINE]: "bg-success-soft text-success-deep border-success-border",
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
    const slot = slots.find((s) => s.iso === slotIso);
    return (
      <div className="max-w-lg mx-auto py-10 text-center">
        <span className="mx-auto w-16 h-16 rounded-full bg-success-soft inline-flex items-center justify-center mb-4 animate-in zoom-in">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Your visit is booked</h1>
        <p className="text-sm text-muted-foreground mt-1">Reference {booked.id.slice(-6).toUpperCase()} · an SMS confirmation is on its way</p>

        <dl className="mt-6 bg-card border border-border rounded-xl px-5 py-2 text-left text-sm divide-y divide-border shadow-xs">
          <Row label="Practitioner" value={selected?.user.name ?? "—"} />
          <Row label="When" value={`${formatDate(date + "T12:00:00+02:00", { weekday: "long", day: "numeric", month: "long" })}${slot ? `, ${slot.label}` : ""}`} />
          <Row label="Priority" value={<StatusBadge kind="triage" value={booked.triageLevel} />} />
          <Row label="You pay" value={<strong className="text-foreground">ZMW {fee.toFixed(2)}</strong>} />
          <p className="py-3 text-xs text-muted-foreground">{booked.billingExplanation}</p>
        </dl>

        {booked.triageLevel === TriageLevel.EMERGENCY && (
          <p role="alert" className="mt-4 flex gap-2 text-left text-sm text-danger-deep bg-danger-soft border border-danger-border rounded-xl px-4 py-3">
            <Siren className="w-5 h-5 text-danger shrink-0" />
            You reported danger signs. Do not wait for this visit if you feel worse: call 991 or go to the nearest health facility now.
          </p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
          <button onClick={() => router.push("/patient/appointments")} className={btnPrimary}>View my appointments</button>
          <button onClick={() => router.push("/patient/dashboard")} className={btnOutline}>Back to overview</button>
        </div>
      </div>
    );
  }

  const steps = [symptoms.length > 0, !!selectedId, !!slotIso];
  const slot = slots.find((s) => s.iso === slotIso);

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <Link href="/patient/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> Overview
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">Book a visit</p>
        <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-foreground">See a practitioner</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Three quick steps. Your answers set your priority; this is not a diagnosis.</p>
      </div>

      <form onSubmit={handleBook} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] items-start">
        <div className="space-y-6 min-w-0">
          {/* 1 · Symptom triage */}
          <Step n={1} done={steps[0]} title="What brings you in?" hint="Choose everything that applies.">
            <div className="flex flex-wrap gap-2 mb-5">
              {ROUTINE_SYMPTOM_CODES.map((code) => (
                <Chip key={code} on={symptoms.includes(code)} onClick={() => toggleSymptom(code)}>{SYMPTOMS[code].label}</Chip>
              ))}
            </div>

            <div className="rounded-lg border border-danger-border bg-danger-soft/50 p-4 mb-5">
              <p className="text-sm font-semibold text-danger-fg mb-2.5 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Danger signs: tick any you have
              </p>
              <div className="flex flex-wrap gap-2">
                {DANGER_SIGN_CODES.map((code) => (
                  <Chip key={code} danger on={symptoms.includes(code)} onClick={() => toggleSymptom(code)}>{SYMPTOMS[code].label}</Chip>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Unwell for</p>
                <Segmented options={DURATIONS.map((d) => ({ label: d.label, value: d.days }))} value={durationDays} onChange={setDurationDays} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">How bad is it?</p>
                <Segmented options={SEVERITIES} value={severity} onChange={setSeverity} />
              </div>
            </div>

            <div aria-live="polite" className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm transition-colors ${TRIAGE_PANEL[triage.level]}`}>
              <Stethoscope className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Priority: {triage.level.charAt(0) + triage.level.slice(1).toLowerCase()}</p>
                <p className="mt-0.5">{triage.advice}</p>
              </div>
            </div>
          </Step>

          {/* 2 · Practitioner */}
          <Step n={2} done={steps[1]} title="Choose a practitioner" hint="Every practitioner's licence is checked by our administrators.">
            {practitioners.length === 0 ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading practitioners…</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {practitioners.map((p) => {
                  const on = selectedId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelectedId(p.id)}
                      className={`relative flex items-start gap-3 p-4 pr-10 rounded-lg border text-left transition ${
                        on ? "border-primary bg-accent ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span className="w-10 h-10 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center font-semibold shrink-0">
                        {initial(p.user.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground text-sm truncate">{p.user.name}</span>
                          {p.isVerified && <ShieldCheck className="w-4 h-4 text-success shrink-0" aria-label="Verified" />}
                        </span>
                        <span className="block text-xs text-muted-foreground">{SPECIALTY_LABEL[p.specialty]}</span>
                        {p.location && (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <MapPin className="w-3 h-3 shrink-0" /> {p.location}
                          </span>
                        )}
                      </span>
                      {on && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </Step>

          {/* 3 · Date & time */}
          <Step n={3} done={steps[2]} title="Pick a date and time">
            <label className="block max-w-xs mb-5">
              <span className="block text-sm font-medium text-foreground mb-1.5">
                <CalendarDays className="w-4 h-4 inline mr-1.5 text-muted-foreground" />Date
              </span>
              <input type="date" min={clinicDateKey()} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </label>

            <p className="text-sm font-medium text-foreground mb-2">
              <Clock className="w-4 h-4 inline mr-1.5 text-muted-foreground" />Open times
            </p>
            {!selectedId || !date ? (
              <p className="text-sm text-muted-foreground">Choose a practitioner and a date to see open times.</p>
            ) : slotsLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking the diary…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-lg bg-secondary px-4 py-3">
                No open times that day. The practitioner may not work then, or the day is fully booked. Try another date.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.iso}
                    type="button"
                    aria-pressed={slotIso === s.iso}
                    onClick={() => setSlotIso(s.iso)}
                    className={`h-10 rounded-lg text-sm font-medium border transition ${
                      slotIso === s.iso ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <label className="block mt-6">
              <span className="block text-sm font-medium text-foreground mb-1.5">
                Anything else the practitioner should know? <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. allergies, medicines you take, best way to reach you" className={textareaCls} />
            </label>
          </Step>
        </div>

        {/* Summary (sticky on large screens) */}
        <aside className="lg:sticky lg:top-8 bg-card border border-border rounded-xl shadow-xs">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Visit summary</h2>
          </div>
          <dl className="px-5 py-2 text-sm divide-y divide-border">
            <Row label="Priority" value={<StatusBadge kind="triage" value={triage.level} />} />
            <Row label="Practitioner" value={selected?.user.name ?? <span className="text-muted-foreground font-normal">Not chosen</span>} />
            <Row
              label="When"
              value={
                slot && date
                  ? `${formatDate(date + "T12:00:00+02:00", { weekday: "short", day: "numeric", month: "short" })}, ${slot.label}`
                  : <span className="text-muted-foreground font-normal">Not chosen</span>
              }
            />
          </dl>
          <div className="mx-5 mb-4 rounded-lg bg-secondary px-4 py-3 text-sm">
            <p className="flex items-center gap-1.5 text-muted-foreground"><CreditCard className="w-4 h-4" /> You pay</p>
            {!selected ? (
              <p className="text-muted-foreground mt-1">Choose a practitioner to see your fee.</p>
            ) : quote ? (
              <>
                <p className="text-2xl font-bold text-foreground mt-0.5">ZMW {quote.finalAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">{quote.explanation}</p>
              </>
            ) : (
              <p className="text-muted-foreground mt-1 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Policy Guardian is calculating…</p>
            )}
          </div>

          <div className="px-5 pb-5">
            {error && (
              <p role="alert" className="mb-3 text-sm text-danger-fg bg-danger-soft border border-danger-border px-3 py-2 rounded-lg">{error}</p>
            )}
            <button type="submit" disabled={loading || !steps[1] || !steps[2]} className={`${btnPrimary} w-full h-11`}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Booking…" : "Confirm booking"}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">You&apos;ll get an SMS confirmation and a reminder the day before.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

/** First letter of the name without an honorific ("Sr. Mutale" → "M"). */
function initial(name: string | null) {
  return (name ?? "P").replace(/^(Sr|Mr|Ms|Mrs|Dr)\.?\s+/i, "").charAt(0).toUpperCase();
}

function Step({ n, done, title, hint, children }: { n: number; done: boolean; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-start gap-3 mb-5">
        <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${done ? "bg-success text-white" : "bg-primary text-primary-foreground"}`}>
          {done ? <CheckCircle2 className="w-4 h-4" /> : n}
        </span>
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Chip({ on, danger, onClick, children }: { on: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  const cls = danger
    ? on ? "bg-danger text-white border-danger" : "bg-card text-danger-fg border-danger-border hover:border-danger-border-strong"
    : on ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary";
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={`h-9 px-3.5 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-1.5 ${cls}`}>
      {on && <CheckCircle2 className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

function Segmented({ options, value, onChange }: { options: { label: string; value: number }[]; value: number; onChange: (v: number) => void }) {
  return (
    <div role="radiogroup" className="inline-flex flex-wrap rounded-lg border border-border bg-secondary p-1 gap-1">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 px-3 rounded-md text-sm transition ${value === o.value ? "bg-card text-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
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
