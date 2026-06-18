"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/patients", label: "Patients" },
  { href: "/practitioners", label: "Practitioners" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-primary font-extrabold text-xl tracking-tight">PCOS</span>
          <span className="hidden sm:inline text-foreground/50 font-light text-sm">SaveServe</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-primary bg-accent"
                    : "text-foreground/60 hover:text-foreground hover:bg-secondary"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-foreground/60 hover:bg-secondary transition-colors"
          onClick={() => setOpen((s) => !s)}
          aria-expanded={open}
        >
          <span className="sr-only">Toggle menu</span>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-border px-6 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-border flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)}
              className="text-center py-2.5 text-sm text-foreground/70">
              Sign in
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}
              className="text-center py-2.5 text-sm font-semibold bg-primary text-white rounded-lg">
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
