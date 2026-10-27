"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, CalendarDays, FileText, CreditCard, Users, LogOut,
  SlidersHorizontal, MessageSquare, BarChart3, CalendarPlus, UserCircle,
  Wallet, HeartHandshake, ClipboardList,
} from "lucide-react";

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
  PATIENT: "Patient", PRACTITIONER: "Practitioner", NGO: "NGO", ADMIN: "Admin",
};

interface Props {
  role: string;
  userName?: string | null;
  userEmail?: string | null;
}

export default function DashboardSidebar({ role, userName, userEmail }: Props) {
  const pathname = usePathname();
  const items = NAV[role] ?? NAV.PATIENT;
  const current = activeHref(items, pathname);

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
        <span className="text-primary font-extrabold text-xl tracking-tight">PCOS</span>
        <span className="text-foreground/40 font-light text-sm">SaveServe</span>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          {ROLE_LABEL[role] ?? role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === current;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                  ? "bg-accent text-primary font-semibold"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : ""}`} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ redirectTo: "/login" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
