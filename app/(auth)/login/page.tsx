"use client";
import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Smartphone } from "lucide-react";
import { btnPrimary, inputCls } from "@/components/app/buttons";
import { Role } from "@/lib/constants";

const ROLE_HOME: Record<string, string> = {
  [Role.PATIENT]: "/patient/dashboard",
  [Role.PRACTITIONER]: "/practitioner/dashboard",
  [Role.NGO]: "/ngo/dashboard",
  [Role.ADMIN]: "/admin/dashboard",
};

// One-click sign-in for presentations: set NEXT_PUBLIC_DEMO_LOGINS=1 (seeded accounts, prisma/seed.ts)
const DEMO = process.env.NEXT_PUBLIC_DEMO_LOGINS === "1";
const DEMO_PASSWORD = "password123";
const DEMO_ACCOUNTS = [
  { role: "Patient", who: "Mwila Chanda · free tier", email: "free@saveserve.org" },
  { role: "Practitioner", who: "Sr. Mutale Banda · nurse", email: "mutale@saveserve.org" },
  { role: "Funding partner", who: "Zambia Health Foundation", email: "ngo@saveserve.org" },
  { role: "Administrator", who: "System administrator", email: "admin@saveserve.org" },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(form.email, form.password);
  }

  async function login(email: string, password: string) {
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      // Fetch fresh session to determine target dashboard
      const session = await getSession();
      const role = session?.user?.role ?? Role.PATIENT;
      const targetUrl = redirectTo || ROLE_HOME[role] || "/";

      // Full page navigate to guarantee cookie and middleware synchronization
      window.location.href = targetUrl;
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your SaveServe account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Link href="/contact" className="text-xs text-primary hover:underline">
                Need help?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={`${inputCls} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger-fg bg-danger-soft border border-danger-border px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`${btnPrimary} w-full`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>

      {DEMO && (
        <div className="mt-8 rounded-xl border border-dashed border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Demo accounts · one click</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                disabled={loading}
                onClick={() => login(a.email, DEMO_PASSWORD)}
                className="text-left rounded-lg border border-border bg-card px-3 py-2 hover:border-primary/40 hover:bg-accent/50 transition disabled:opacity-60"
              >
                <span className="block text-sm font-semibold text-foreground">{a.role}</span>
                <span className="block text-xs text-muted-foreground truncate">{a.who}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Smartphone className="w-3.5 h-3.5" /> No smartphone? Dial <span className="font-bold text-foreground">*384#</span> to use SaveServe by USSD.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
