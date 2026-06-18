"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Users, Stethoscope, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { Role } from "@/lib/constants";

const ROLES = [
  {
    value: Role.PATIENT,
    label: "Patient",
    desc: "I need healthcare services",
    icon: Users,
  },
  {
    value: Role.PRACTITIONER,
    label: "Practitioner",
    desc: "I provide healthcare services",
    icon: Stethoscope,
  },
  {
    value: Role.NGO,
    label: "NGO / Organisation",
    desc: "We fund subsidised care",
    icon: Building2,
  },
] as const;

const SPECIALTIES = [
  { value: "NURSE", label: "Nurse" },
  { value: "PHARMACIST", label: "Pharmacist" },
  { value: "PHYSIOTHERAPIST", label: "Physiotherapist" },
];

type RoleValue = (typeof ROLES)[number]["value"];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleValue>(Role.PATIENT);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    specialty: "NURSE",
    licenseNo: "",
    location: "",
    orgName: "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    // Auto sign-in after registration
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    const ROLE_HOME: Record<string, string> = {
      [Role.PATIENT]: "/patient/dashboard",
      [Role.PRACTITIONER]: "/practitioner/dashboard",
      [Role.NGO]: "/ngo/dashboard",
    };
    router.push(ROLE_HOME[role] ?? "/");
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";
  const labelCls = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="w-full max-w-lg">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join SaveServe — accessible healthcare for everyone.
          </p>
        </div>

        {/* Step 1 — Role picker */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground mb-3">I am joining as a…</p>
            {ROLES.map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  role === value
                    ? "border-primary bg-secondary"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  role === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                {role === value && (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-2 w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:opacity-90 transition"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Details form */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
            >
              ← Back
            </button>

            {/* Common fields */}
            <div>
              <label className={labelCls}>Full name</label>
              <input className={inputCls} required placeholder="Chanda Mwila"
                value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Email address</label>
              <input className={inputCls} type="email" required placeholder="you@example.com"
                value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Phone number</label>
              <input className={inputCls} type="tel" placeholder="+260 97X XXX XXX"
                value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <input className={inputCls} type="password" required placeholder="At least 6 characters"
                value={form.password} onChange={(e) => set("password", e.target.value)} />
            </div>

            {/* Practitioner-only fields */}
            {role === Role.PRACTITIONER && (
              <>
                <div>
                  <label className={labelCls}>Specialty</label>
                  <select className={inputCls}
                    value={form.specialty} onChange={(e) => set("specialty", e.target.value)}>
                    {SPECIALTIES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Medical Licence No.</label>
                  <input className={inputCls} placeholder="e.g. ZNC-2024-001"
                    value={form.licenseNo} onChange={(e) => set("licenseNo", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Operating Location</label>
                  <input className={inputCls} placeholder="e.g. Lusaka, Chilenje"
                    value={form.location} onChange={(e) => set("location", e.target.value)} />
                </div>
              </>
            )}

            {/* NGO-only fields */}
            {role === Role.NGO && (
              <div>
                <label className={labelCls}>Organisation name</label>
                <input className={inputCls} placeholder="e.g. Zambia Health Foundation"
                  value={form.orgName} onChange={(e) => set("orgName", e.target.value)} />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:opacity-90 disabled:opacity-60 transition"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
