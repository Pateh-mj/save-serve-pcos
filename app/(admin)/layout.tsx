import DashboardShell from "@/components/app/DashboardShell";
import { Role } from "@/lib/constants";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role={Role.ADMIN}>{children}</DashboardShell>;
}
