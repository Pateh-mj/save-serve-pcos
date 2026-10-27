import DashboardShell from "@/components/app/DashboardShell";
import { Role } from "@/lib/constants";

export default function NGOLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role={Role.NGO}>{children}</DashboardShell>;
}
