import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "SaveServe — Account" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <header className="h-16 flex items-center px-6 bg-white border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-primary font-extrabold text-xl tracking-tight">PCOS</span>
          <span className="text-foreground/50 font-light text-sm">SaveServe</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
      <footer className="h-12 flex items-center justify-center border-t border-border bg-white">
        <p className="text-xs text-muted-foreground">© 2026 SaveServe · Accessible Healthcare in Zambia</p>
      </footer>
    </div>
  );
}
