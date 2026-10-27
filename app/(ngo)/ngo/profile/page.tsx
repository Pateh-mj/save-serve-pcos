import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountSection from "@/components/account/AccountSection";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";

export const metadata = { title: "Organisation" };

export default async function NgoProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { ngo: true } });
  if (!user?.ngo) redirect("/login");

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Organisation Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
      </div>

      <AccountSection title="Organisation">
        <ProfileForm
          fields={[
            { name: "orgName", label: "Organisation name", value: user.ngo.name, required: true },
            { name: "name", label: "Contact person", value: user.name ?? "", required: true },
            { name: "phone", label: "Contact mobile number", type: "tel", value: user.phone ?? "", placeholder: "0971234567" },
          ]}
        />
      </AccountSection>

      <AccountSection title="Password">
        <PasswordForm />
      </AccountSection>
    </div>
  );
}
