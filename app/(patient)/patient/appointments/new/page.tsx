"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, ShieldCheck, CalendarDays, Clock,
  CheckCircle2, Loader2, ArrowLeft, CreditCard,
} from "lucide-react";

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

const TIMES = [
  "08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00",
];

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("practitionerId");

  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedId, setSelectedId] = useState(preselectedId ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/practitioners")
      .then((r) => r.json())
      .then(setPractitioners)
      .catch(() => {});
  }, []);

  const selected = practitioners.find((p) => p.id === selectedId);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !date || !time) { setError("Please select a practitioner, date and time."); return; }
    setLoading(true);
    setError("");

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ practitionerId: selectedId, scheduledAt, notes }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Booking failed.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/patient/appointments"), 2000);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-emerald/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-brand-emerald" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">Appointment Booked!</h2>
        <p className="text-muted-foreground">Redirecting to your appointments…</p>
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
          <h1 className="text-3xl font-extrabold text-foreground">Book an Appointment</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Select a practitioner and a time slot.</p>
        </div>
      </div>

      <form onSubmit={handleBook} className="space-y-6">
        {/* Practitioner selection */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
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
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
            Choose Date & Time
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <CalendarDays className="w-4 h-4 inline mr-1.5" />Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                <Clock className="w-4 h-4 inline mr-1.5" />Time slot
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      time === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
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

        {/* Billing preview */}
        {selected && (
          <div className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl text-sm">
            <CreditCard className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-secondary-foreground">
              Policy Guardian will calculate your billing based on your current tier before confirmation.
            </span>
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
