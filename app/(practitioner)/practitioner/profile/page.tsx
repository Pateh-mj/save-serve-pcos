import { redirect } from "next/navigation";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountSection from "@/components/account/AccountSection";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata = { title: "My Profile" };

const SPECIALTY: Record<string, string> = { NURSE: "Nurse", PHARMACIST: "Pharmacist", PHYSIOTHERAPIST: "Physiotherapist" };

export default async function PractitionerProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { practitioner: true } });
  if (!user?.practitioner) redirect("/login");
  const p = user.practitioner;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="My Profile" description="What patients see when they book, and how SaveServe reaches you." />

      <AccountSection title="Licence">
        <dl className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Specialty</dt>
            <dd className="font-semibold text-foreground">{SPECIALTY[p.specialty] ?? p.specialty}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Licence number</dt>
            <dd className="font-semibold text-foreground">{p.licenseNo}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className={`font-semibold inline-flex items-center gap-1 ${p.isVerified ? "text-success-fg" : "text-warning-fg"}`}>
              {p.isVerified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {p.isVerified ? "Verified" : "Awaiting administrator verification"}
            </dd>
          </div>
        </dl>
        {!p.isVerified && (
          <p className="text-xs text-muted-foreground mt-3">Patients can book you once an administrator has verified your licence.</p>
        )}
      </AccountSection>

      <AccountSection title="Profile" description="Your mobile number receives SMS alerts when a patient books with urgent or emergency symptoms.">
        <ProfileForm
          fields={[
            { name: "name", label: "Display name", value: user.name ?? "", required: true, placeholder: "e.g. Sr. Mutale Banda" },
            { name: "phone", label: "Mobile number", type: "tel", value: user.phone ?? "", placeholder: "0971234567" },
            { name: "location", label: "Location", value: p.location ?? "", placeholder: "Clinic, area, town" },
            { name: "bio", label: "Short bio", type: "textarea", value: p.bio ?? "", placeholder: "Experience and services you offer" },
          ]}
          note="A new name shows in the sidebar after you next sign in."
        />
      </AccountSection>

      <AccountSection title="Password">
        <PasswordForm />
      </AccountSection>
    </div>
  );
}
