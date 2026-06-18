"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, CalendarDays, FileText, CreditCard,
  Users, Stethoscope, Building2, BarChart3, Settings, LogOut,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ElementType };

const NAV: Record<string, NavItem[]> = {
  PATIENT: [
    { href: "/patient/dashboard",     label: "Overview",        icon: LayoutDashboard },
    { href: "/patient/appointments",  label: "Appointments",    icon: CalendarDays },
    { href: "/patient/records",       label: "Health Records",  icon: FileText },
    { href: "/patient/billing",       label: "My Billing",      icon: CreditCard },
  ],
  PRACTITIONER: [
    { href: "/practitioner/dashboard", label: "Dashboard",   icon: LayoutDashboard },
    { href: "/practitioner/schedule",  label: "Schedule",    icon: CalendarDays },
    { href: "/practitioner/patients",  label: "Patients",    icon: Users },
    { href: "/practitioner/records",   label: "EHR Records", icon: FileText },
  ],
  NGO: [
    { href: "/ngo/dashboard",        label: "Dashboard",      icon: LayoutDashboard },
    { href: "/ngo/funding",          label: "Funding",        icon: CreditCard },
    { href: "/ngo/beneficiaries",    label: "Beneficiaries",  icon: Users },
    { href: "/ngo/reports",          label: "Reports",        icon: BarChart3 },
  ],
  ADMIN: [
    { href: "/admin/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
    { href: "/admin/users",         label: "Users",        icon: Users },
    { href: "/admin/practitioners", label: "Practitioners", icon: Stethoscope },
    { href: "/admin/policies",      label: "Policies",     icon: FileText },
    { href: "/admin/reports",       label: "Reports",      icon: BarChart3 },
  ],
};

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
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-primary font-semibold"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : ""}`} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}

        <div className="pt-3 border-t border-border mt-3">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" strokeWidth={1.75} />
            Settings
          </Link>
        </div>
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
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
