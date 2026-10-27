/**
 * Sample activity for presentations: 8 patients (…@demo.saveserve.org) with eight weeks of
 * visits across the seeded practitioners, so dashboards, charts and queues have something
 * to show.
 *
 *   npm run db:demo              (re)create the sample activity
 *   npm run db:demo -- --remove  delete it again (pools are re-reconciled)
 *
 * Bills and fund movements follow the same rules as real bookings (lib/booking.ts,
 * lib/billing.ts, lib/appointments.ts): FREE visits are debited from the best-funded pool
 * up to the monthly limit, PREMIUM payments credit the surplus, cancellations refund.
 * It writes NO ratings, SMS or response timings, so the Evaluation page (report
 * objective 4) only ever reflects real use.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assessTriage, type SymptomCode } from "../lib/triage";
import { cleanTestData } from "./test-data";

const prisma = new PrismaClient();
const DOMAIN = "@demo.saveserve.org";
const DAY = 86_400_000;

// Deterministic, so every run produces the same history
let seed = 20261030;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];

const PATIENTS = [
  { name: "Chilufya Mwansa", tier: "FREE", female: true },
  { name: "Mutinta Hamweemba", tier: "FREE", female: true },
  { name: "Bupe Kasonde", tier: "FREE", female: true },
  { name: "Lweendo Siame", tier: "FREE", female: false },
  { name: "Mulenga Zulu", tier: "FREE", female: false },
  { name: "Kondwani Phiri", tier: "BASIC", female: false },
  { name: "Taonga Lungu", tier: "BASIC", female: true },
  { name: "Chanda Musonda", tier: "PREMIUM", female: false },
] as const;

const CARE: Record<string, { specialty: string; diagnosis: string; prescription: string; notes: string }> = {
  FEVER: { specialty: "NURSE", diagnosis: "Uncomplicated malaria (RDT positive)", prescription: "Artemether-lumefantrine 80/480 mg BD × 3 days; paracetamol 1 g TDS", notes: "Return at once if vomiting or confusion develops." },
  COUGH: { specialty: "PHARMACIST", diagnosis: "Upper respiratory tract infection", prescription: "Amoxicillin 500 mg TDS × 5 days; steam inhalation", notes: "Review if fever persists beyond 3 days." },
  HEADACHE: { specialty: "NURSE", diagnosis: "Tension-type headache; BP 128/82", prescription: "Paracetamol 1 g as needed; oral fluids", notes: "Keep a headache diary for two weeks." },
  STOMACH: { specialty: "NURSE", diagnosis: "Acute gastroenteritis with mild dehydration", prescription: "ORS after each loose stool; zinc 20 mg OD × 10 days", notes: "Danger signs explained: blood in stool, unable to drink." },
  PAIN: { specialty: "PHYSIOTHERAPIST", diagnosis: "Mechanical low back pain", prescription: "Ibuprofen 400 mg TDS × 5 days with food", notes: "Home exercise programme taught; review in 2 weeks." },
  RASH: { specialty: "PHARMACIST", diagnosis: "Contact dermatitis", prescription: "Hydrocortisone 1% cream BD × 7 days", notes: "Avoid the suspected soap." },
  PREGNANCY: { specialty: "NURSE", diagnosis: "Antenatal check, 24 weeks, normal progress", prescription: "Ferrous sulphate 200 mg + folic acid 5 mg OD", notes: "Next antenatal visit booked at the clinic." },
  INJURY: { specialty: "PHYSIOTHERAPIST", diagnosis: "Ankle sprain, grade I", prescription: "Rest, ice, compression, elevation; paracetamol as needed", notes: "Graded walking from day 3." },
  MEDICATION: { specialty: "PHARMACIST", diagnosis: "Hypertension review, BP controlled (132/84)", prescription: "Amlodipine 5 mg OD, 30-day refill", notes: "Reduce salt; recheck BP next month." },
};
const ROUTINE = Object.keys(CARE) as SymptomCode[];
const symptomsFor = (p: { female: boolean }) => (p.female ? ROUTINE : ROUTINE.filter((c) => c !== "PREGNANCY"));

/** A clinic-time (UTC+2) Date for a day offset and hour. */
function at(dayOffset: number, hour: number) {
  const d = new Date(Date.now() + dayOffset * DAY);
  const key = new Date(d.getTime() + 2 * 3600_000).toISOString().slice(0, 10);
  return new Date(`${key}T${String(hour).padStart(2, "0")}:00:00+02:00`);
}
const isWeekday = (d: Date) => ![0, 6].includes(new Date(d.getTime() + 2 * 3600_000).getUTCDay());
const monthKey = (d: Date) => new Date(d.getTime() + 2 * 3600_000).toISOString().slice(0, 7);

async function remove() {
  return cleanTestData(prisma, { smoke: false, emailSuffix: DOMAIN });
}

async function create() {
  const [practitioners, ngos, policies, feeRow] = await Promise.all([
    prisma.practitioner.findMany({ where: { isVerified: true }, include: { user: true } }),
    prisma.nGO.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.policy.findMany({ where: { isActive: true } }),
    prisma.setting.findUnique({ where: { key: "consultationFee" } }),
  ]);
  if (!practitioners.length || !ngos.length) throw new Error("Seed the database first (npm run db:seed).");
  const fee = Number(feeRow?.value) > 0 ? Number(feeRow!.value) : 150;
  const policy = (tier: string) => policies.find((p) => p.tier === tier);
  const freeLimit = (() => {
    try { return JSON.parse(policy("FREE")?.rules ?? "{}").maxVisitsPerMonth as number | undefined; } catch { return undefined; }
  })();
  const multiplier = (tier: string) => policy(tier)?.billingMultiplier ?? (tier === "PREMIUM" ? 2 : tier === "BASIC" ? 1 : 0);
  const premiumPool = ngos[0]; // the real flow credits the oldest pool
  const balances = new Map(ngos.map((n) => [n.id, n.fundBalance]));

  // Times already taken by real bookings, so sample visits never clash with them
  const taken = new Set(
    (await prisma.appointment.findMany({ where: { status: { in: ["PENDING", "CONFIRMED"] } }, select: { practitionerId: true, scheduledAt: true } }))
      .map((a) => `${a.practitionerId}|${a.scheduledAt.toISOString()}`)
  );

  const password = await bcrypt.hash("password123", 12);
  const patients = [];
  for (const p of PATIENTS) {
    const email = p.name.toLowerCase().replace(/\s+/g, ".") + DOMAIN;
    const user = await prisma.user.create({
      data: { name: p.name, email, password, role: "PATIENT", tier: p.tier, patient: { create: {} } },
      include: { patient: true },
    });
    patients.push({ ...p, patientId: user.patient!.id });
  }

  // Past visits: eight weeks back to yesterday. Upcoming: the next few working days.
  type Plan = { when: Date; patient: (typeof patients)[number]; symptoms: SymptomCode[]; severity: number; status: string; channel: string };
  const plans: Plan[] = [];
  for (let day = -56; day <= -1; day++) {
    const date = at(day, 9);
    if (!isWeekday(date)) continue;
    const visits = rand() < 0.25 ? 0 : 1 + Math.floor(rand() * 2) + (day > -21 ? 1 : 0); // busier lately
    for (let i = 0; i < visits; i++) {
      const patient = pick(patients);
      plans.push({
        when: at(day, 8 + Math.floor(rand() * 9)),
        patient,
        symptoms: [pick(symptomsFor(patient)), ...(rand() < 0.3 ? [pick(symptomsFor(patient))] : [])],
        severity: 1 + Math.floor(rand() * 2),
        status: rand() < 0.12 ? "CANCELLED" : "COMPLETED",
        // Free-tier patients mostly use feature phones
        channel: patient.tier === "FREE" ? (rand() < 0.65 ? "USSD" : "WEB") : rand() < 0.2 ? "USSD" : "WEB",
      });
    }
  }
  // Upcoming queue for the triage demo, led by the practitioner used in docs/DEMO.md
  const mutale = practitioners.find((p) => p.user.email === "mutale@saveserve.org") ?? practitioners[0];
  const upcoming: (Omit<Plan, "when"> & { day: number; hour: number; practitionerId: string })[] = [
    { day: 1, hour: 9, patient: patients[0], symptoms: ["FEVER", "BREATHING"], severity: 3, status: "PENDING", channel: "USSD", practitionerId: mutale.id },
    { day: 1, hour: 11, patient: patients[2], symptoms: ["PREGNANCY", "STOMACH"], severity: 2, status: "CONFIRMED", channel: "USSD", practitionerId: mutale.id },
    { day: 1, hour: 14, patient: patients[5], symptoms: ["HEADACHE"], severity: 1, status: "PENDING", channel: "WEB", practitionerId: mutale.id },
    { day: 2, hour: 10, patient: patients[7], symptoms: ["FEVER", "STOMACH"], severity: 3, status: "CONFIRMED", channel: "WEB", practitionerId: mutale.id },
    { day: 2, hour: 15, patient: patients[3], symptoms: ["COUGH"], severity: 1, status: "CONFIRMED", channel: "USSD", practitionerId: mutale.id },
  ];

  const subsidisedThisMonth = new Map<string, number>();
  let created = 0;

  async function book(plan: Plan & { practitionerId?: string }) {
    const care = CARE[plan.symptoms[0]] ?? CARE.FEVER;
    const candidates = plan.practitionerId
      ? practitioners.filter((p) => p.id === plan.practitionerId)
      : practitioners.filter((p) => p.specialty === care.specialty);
    let practitioner = pick(candidates.length ? candidates : practitioners);
    let when = plan.when;
    for (let tries = 0; taken.has(`${practitioner.id}|${when.toISOString()}`) && tries < 10; tries++) {
      when = new Date(when.getTime() + 3600_000);
      if (!plan.practitionerId) practitioner = pick(candidates.length ? candidates : practitioners);
    }
    taken.add(`${practitioner.id}|${when.toISOString()}`);
    const bookedAt = new Date(Math.min(when.getTime() - (1 + rand() * 3) * DAY, Date.now() - 3600_000));

    const durationDays = plan.severity === 3 ? 2 : pick([0, 2, 5]);
    const triage = assessTriage({ symptoms: plan.symptoms, durationDays, severity: plan.severity });
    const tier = plan.patient.tier;

    // Policy Guardian, as calculatePolicyBilling decides it
    const subsidisedCount = subsidisedThisMonth.get(`${plan.patient.patientId}|${monthKey(bookedAt)}`) ?? 0;
    const free = tier === "FREE" && (freeLimit === undefined || subsidisedCount < freeLimit);
    const sponsor = free ? ngos.filter((n) => balances.get(n.id)! >= fee).sort((a, b) => balances.get(b.id)! - balances.get(a.id)!)[0] : undefined;
    const finalAmount = tier === "FREE" ? (free ? 0 : fee) : fee * multiplier(tier);
    const billingStatus = sponsor ? "SUBSIDIZED" : free ? "WAIVED" : "PENDING";

    const appt = await prisma.appointment.create({
      data: {
        patientId: plan.patient.patientId,
        practitionerId: practitioner.id,
        scheduledAt: when,
        status: plan.status,
        channel: plan.channel,
        triageLevel: triage.level,
        triageScore: triage.score,
        symptoms: triage.symptoms.join(","),
        createdAt: bookedAt,
        reminderSentAt: when < new Date() ? when : null,
        billing: {
          create: {
            patientId: plan.patient.patientId,
            amount: fee,
            discountedAmount: finalAmount,
            tier,
            subsidyApplied: !!sponsor,
            subsidyAmount: sponsor ? fee : null,
            status: billingStatus,
            policyId: policy(tier)?.id,
            ngoId: sponsor?.id ?? (tier === "PREMIUM" ? premiumPool.id : null),
            createdAt: bookedAt,
          },
        },
      },
      include: { billing: true },
    });
    const billing = appt.billing!;
    const ledger = async (ngoId: string, type: string, amount: number, createdAt: Date, note: string) => {
      balances.set(ngoId, balances.get(ngoId)! + amount);
      await prisma.fundTransaction.create({ data: { ngoId, type, amount, billingId: billing.id, note, createdAt } });
    };

    if (sponsor) {
      subsidisedThisMonth.set(`${plan.patient.patientId}|${monthKey(bookedAt)}`, subsidisedCount + 1);
      await ledger(sponsor.id, "SUBSIDY_DEBIT", -fee, bookedAt, `Subsidised visit ${appt.id.slice(-6).toUpperCase()}`);
    }

    if (plan.status === "CANCELLED") {
      const cancelledAt = new Date(bookedAt.getTime() + DAY / 2);
      if (sponsor) await ledger(sponsor.id, "SUBSIDY_REFUND", fee, cancelledAt, "Appointment cancelled");
      if (billingStatus !== "WAIVED") {
        await prisma.billing.update({ where: { id: billing.id }, data: { status: "WAIVED", subsidyApplied: false } });
      }
    } else if (plan.status === "COMPLETED") {
      await prisma.eHRRecord.create({
        data: {
          patientId: plan.patient.patientId,
          practitionerId: practitioner.id,
          appointmentId: appt.id,
          visitDate: when,
          diagnosis: care.diagnosis,
          prescription: care.prescription,
          notes: care.notes,
          createdAt: when,
        },
      });
      if (billingStatus === "PENDING" && rand() < 0.85) {
        // Paid by mobile money after the visit; premium surplus reaches the pool
        const paidAt = new Date(when.getTime() + 3600_000);
        await prisma.billing.update({ where: { id: billing.id }, data: { status: "PAID" } });
        if (finalAmount > fee) await ledger(premiumPool.id, "PREMIUM_CREDIT", finalAmount - fee, paidAt, "Premium surplus (Robin Hood)");
      }
    }
    created++;
  }

  for (const plan of plans.sort((a, b) => a.when.getTime() - b.when.getTime())) await book(plan);
  for (const u of upcoming) {
    let day = u.day;
    while (!isWeekday(at(day, u.hour))) day++;
    await book({ ...u, when: at(day, u.hour) });
  }

  // Pools reflect the ledger (all movements above went through it)
  for (const [id, balance] of balances) {
    await prisma.nGO.update({ where: { id }, data: { fundBalance: Math.round(balance * 100) / 100 } });
  }
  return { patients: patients.length, appointments: created };
}

(async () => {
  const removed = await remove();
  if (process.argv.includes("--remove")) {
    console.log(`Removed ${removed.users} sample patient(s) and their activity; pools re-reconciled.`);
    return;
  }
  const r = await create();
  console.log(`Sample activity: ${r.patients} patients (password123, …${DOMAIN}), ${r.appointments} visits over 8 weeks plus an upcoming triage queue.`);
  console.log("Remove any time with: npm run db:demo -- --remove");
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
