import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountSection from "@/components/account/AccountSection";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";

export const metadata = { title: "My Account" };

export default async function AdminAccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">My Account</h1>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
      </div>

      <AccountSection title="Profile">
        <ProfileForm
          fields={[
            { name: "name", label: "Name", value: user.name ?? "", required: true },
            { name: "phone", label: "Mobile number", type: "tel", value: user.phone ?? "", placeholder: "0971234567" },
          ]}
        />
      </AccountSection>

      <AccountSection title="Password" description="The demo accounts use password123 — change it before the system is used for real.">
        <PasswordForm />
      </AccountSection>
    </div>
  );
}
