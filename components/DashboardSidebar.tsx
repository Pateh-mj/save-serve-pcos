"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, CalendarDays, FileText, CreditCard, Users, LogOut,
  SlidersHorizontal, MessageSquare, BarChart3, CalendarPlus, UserCircle,
  Wallet, HeartHandshake, ClipboardList, Menu, X, Siren,
} from "lucide-react";
import { BrandMark } from "@/components/app/BrandMark";

type NavItem = { href: string; label: string; icon: React.ElementType };

const NAV: Record<string, NavItem[]> = {
  PATIENT: [
    { href: "/patient/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/patient/appointments/new", label: "Book a Visit", icon: CalendarPlus },
    { href: "/patient/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/patient/records", label: "Health Records", icon: FileText },
    { href: "/patient/billing", label: "My Billing", icon: CreditCard },
    { href: "/patient/profile", label: "My Profile", icon: UserCircle },
  ],
  PRACTITIONER: [
    { href: "/practitioner/dashboard", label: "Triage Queue", icon: LayoutDashboard },
    { href: "/practitioner/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/practitioner/patients", label: "Patients", icon: Users },
    { href: "/practitioner/records", label: "EHR Records", icon: FileText },
    { href: "/practitioner/profile", label: "My Profile", icon: UserCircle },
  ],
  NGO: [
    { href: "/ngo/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ngo/funding", label: "Funding & Ledger", icon: Wallet },
    { href: "/ngo/beneficiaries", label: "Beneficiaries", icon: HeartHandshake },
    { href: "/ngo/impact", label: "Impact Report", icon: BarChart3 },
    { href: "/ngo/profile", label: "Organisation", icon: UserCircle },
  ],
  ADMIN: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/appointments", label: "Appointments", icon: ClipboardList },
    { href: "/admin/users", label: "Users & Tiers", icon: Users },
    { href: "/admin/policies", label: "Policy Guardian", icon: SlidersHorizontal },
    { href: "/admin/sms", label: "SMS Gateway", icon: MessageSquare },
    { href: "/admin/evaluation", label: "Evaluation", icon: BarChart3 },
    { href: "/admin/account", label: "My Account", icon: UserCircle },
  ],
};

/** The single nav item for the current page: the longest href the path starts with. */
function activeHref(items: NavItem[], pathname: string) {
  return items
    .filter(({ href }) => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

const ROLE_LABEL: Record<string, string> = {
  PATIENT: "Patient portal", PRACTITIONER: "Clinician portal", NGO: "Funding partner", ADMIN: "Administration",
};

interface Props {
  role: string;
  userName?: string | null;
  userEmail?: string | null;
}

/** Fixed sidebar on large screens; a top bar with a slide-out menu below `lg`. */
export default function DashboardSidebar({ role, userName, userEmail }: Props) {
  const pathname = usePathname();
  const items = NAV[role] ?? NAV.PATIENT;
  const current = activeHref(items, pathname);
  const [open, setOpen] = useState(false);
  const currentLabel = items.find((i) => i.href === current)?.label ?? ROLE_LABEL[role];

  // Close the drawer on Escape (links close it on click)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const panel = (
    <>
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border">
        <BrandMark />
        <div className="leading-tight">
          <p className="font-bold text-foreground tracking-tight">SaveServe</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABEL[role] ?? role}</p>
        </div>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === current;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-sidebar-foreground font-medium hover:bg-secondary hover:text-foreground"
              }`}
            >
              {active && <span aria-hidden className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />}
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {role === "PATIENT" && (
        <div className="mx-3 mb-3 rounded-lg border border-danger-border bg-danger-soft px-3 py-2.5 text-xs text-danger-deep flex gap-2">
          <Siren className="w-4 h-4 shrink-0 text-danger" strokeWidth={1.75} />
          <span><strong>Emergency?</strong> Call 991 or go to the nearest health facility.</span>
        </div>
      )}

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0">
            {userName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ redirectTo: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-danger-fg hover:bg-danger-soft transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Large screens: fixed sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-border flex-col z-40">
        {panel}
      </aside>

      {/* Small screens: top bar + drawer */}
      <header className="lg:hidden sticky top-0 z-40 h-14 bg-sidebar/95 backdrop-blur border-b border-border flex items-center gap-3 px-4">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="-ml-1.5 p-1.5 rounded-lg text-foreground hover:bg-secondary"
        >
          <Menu className="w-5 h-5" />
        </button>
        <BrandMark size="sm" />
        <p className="font-semibold text-foreground truncate">{currentLabel}</p>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-foreground/40 animate-in fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 p-1.5 rounded-lg text-muted-foreground hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>
            {panel}
          </aside>
        </div>
      )}
    </>
  );
}
