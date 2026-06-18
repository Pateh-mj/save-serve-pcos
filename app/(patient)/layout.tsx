import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      {/* Main area offset by sidebar width */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
