import type { Metadata } from "next";
import Link from "next/link";
import { Siren, HeartHandshake, Smartphone } from "lucide-react";
import { BrandMark } from "@/components/app/BrandMark";

export const metadata: Metadata = { title: "Account" };

const POINTS = [
  { icon: Siren, title: "Triage first", text: "Danger signs put the sickest patients at the top of the clinician's queue." },
  { icon: HeartHandshake, title: "Fair by design", text: "Premium fees and partner funds pay for free care: the Robin Hood model." },
  { icon: Smartphone, title: "Any phone", text: "Book on the web, or dial *384# on a basic phone with no data." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel (large screens) */}
      <aside className="hidden lg:flex relative overflow-hidden bg-primary text-primary-foreground flex-col justify-between p-12">
        <svg aria-hidden viewBox="0 0 24 24" className="absolute -right-24 -bottom-24 w-[28rem] h-[28rem] opacity-[0.07]" fill="currentColor">
          <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />
        </svg>
        <Link href="/" className="relative flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-white/15 inline-flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" /></svg>
          </span>
          <span className="text-xl font-bold tracking-tight">SaveServe</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">Healthcare that reaches everyone in Zambia.</h2>
          <p className="mt-3 text-primary-foreground/85">
            A patient-centric orchestration system connecting patients with mobile nurses, pharmacists and physiotherapists.
          </p>
          <ul className="mt-10 space-y-6">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="w-10 h-10 rounded-lg bg-white/15 inline-flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-primary-foreground/80">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/70">© 2026 SaveServe · PCOS prototype · ICU Lusaka</p>
      </aside>

      {/* Form side */}
      <div className="min-h-screen flex flex-col">
        <header className="h-16 flex items-center px-6 lg:hidden border-b border-border bg-card">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <span className="font-bold text-foreground tracking-tight">SaveServe</span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-8">{children}</main>
        <footer className="py-4 text-center text-xs text-muted-foreground lg:hidden">© 2026 SaveServe · Accessible healthcare in Zambia</footer>
      </div>
    </div>
  );
}
