import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Role } from "@/lib/constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== Role.ADMIN) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <main className="ml-64 min-h-screen">{children}</main>
    </div>
  );
}
