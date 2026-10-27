import DashboardShell from "@/components/app/DashboardShell";
import { Role } from "@/lib/constants";

export default function PractitionerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role={Role.PRACTITIONER}>{children}</DashboardShell>;
}
