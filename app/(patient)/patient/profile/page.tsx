import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePolicyBilling } from "@/lib/policy-guardian";
import { clinicDateKey, formatDateTime } from "@/lib/format";
import AccountSection from "@/components/account/AccountSection";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";

export const metadata = { title: "My Profile" };

const TIER_TEXT: Record<string, string> = {
  FREE: "Community tier: your visits are funded from the community health equity fund, up to a monthly limit.",
  BASIC: "Standard tier: you pay the standard consultation fee.",
  PREMIUM: "Premium tier: you pay above the standard fee, and the extra funds care for community-tier patients.",
};

export default async function PatientProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { patient: true } });
  if (!user?.patient) redirect("/login");
  const patient = user.patient;

  const [quote, messages] = await Promise.all([
    calculatePolicyBilling({ patientId: patient.id, practitionerId: "" }),
    prisma.smsMessage.findMany({
      where: { OR: [{ userId: user.id }, ...(user.phone ? [{ to: user.phone }] : [])] },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your details, billing tier and messages.</p>
      </div>

      <AccountSection title="Personal details" description="Your phone number receives SMS confirmations and lets you use the USSD menu (*384#).">
        <ProfileForm
          fields={[
            { name: "name", label: "Full name", value: user.name ?? "", required: true },
            { name: "phone", label: "Mobile number", type: "tel", value: user.phone ?? "", placeholder: "0971234567" },
            { name: "nrc", label: "NRC number", value: patient.nrc ?? "", placeholder: "123456/10/1" },
            {
              name: "dateOfBirth",
              label: "Date of birth",
              type: "date",
              value: patient.dateOfBirth ? clinicDateKey(patient.dateOfBirth) : "",
            },
            { name: "address", label: "Address", value: patient.address ?? "" },
            { name: "emergencyContact", label: "Emergency contact", value: patient.emergencyContact ?? "", placeholder: "Name and phone number" },
          ]}
          note="A new name shows in the sidebar after you next sign in."
        />
      </AccountSection>

      <AccountSection title="Billing tier" description="Tiers are set by the clinic's administrators and applied by the Policy Guardian.">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-bold px-3 py-1 rounded-full bg-accent text-primary border border-primary/20">{quote.tier}</span>
          <p className="text-sm text-foreground">
            You pay <strong>ZMW {quote.finalAmount.toFixed(2)}</strong> per visit.
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-3">{TIER_TEXT[quote.tier] ?? quote.explanation}</p>
        <p className="text-xs text-muted-foreground mt-1">{quote.explanation}</p>
      </AccountSection>

      <AccountSection title="SMS messages" description="The latest messages SaveServe sent to your phone.">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {messages.map((m) => (
              <li key={m.id} className="py-2.5 text-sm">
                <p className="text-foreground">{m.body}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDateTime(m.createdAt)} · {m.status === "SKIPPED" ? "not sent" : m.status.toLowerCase()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AccountSection>

      <AccountSection title="Password">
        <PasswordForm />
      </AccountSection>
    </div>
  );
}
