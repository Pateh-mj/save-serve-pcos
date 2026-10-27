import DashboardShell from "@/components/app/DashboardShell";
import { Role } from "@/lib/constants";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role={Role.PATIENT}>{children}</DashboardShell>;
}
