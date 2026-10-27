import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardSidebar from "@/components/DashboardSidebar";

/**
 * Layout for every signed-in portal: checks the role, renders the navigation and gives
 * pages one consistent content area (pages set only their max width).
 */
export default async function DashboardShell({ role, children }: { role: string; children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== role) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={session.user.role} userName={session.user.name} userEmail={session.user.email} />
      <main className="lg:ml-64 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
