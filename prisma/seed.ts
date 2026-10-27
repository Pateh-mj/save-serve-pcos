import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // ─── Policies ───────────────────────────────────────────────────────────────
  const policies = [
    {
      id: "policy-free",
      name: "Free Tier — Fully Subsidised",
      tier: "FREE",
      billingMultiplier: 0,
      rules: JSON.stringify({ subsidySource: "NGO_POOL", maxVisitsPerMonth: 2 }),
    },
    {
      id: "policy-basic",
      name: "Basic Tier — Standard Rate",
      tier: "BASIC",
      billingMultiplier: 1.0,
      rules: JSON.stringify({ discountPercent: 0 }),
    },
    {
      id: "policy-premium",
      name: "Premium Tier — Full Rate + Subsidy Contribution",
      tier: "PREMIUM",
      billingMultiplier: 2.0,
      rules: JSON.stringify({ surplusToNGOPool: true, discountPercent: 0 }),
    },
  ];

  for (const p of policies) {
    await prisma.policy.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, isActive: true },
    });
  }

  // ─── Practitioners ───────────────────────────────────────────────────────────
  const practitioners = [
    {
      name: "Sr. Mutale Banda",
      email: "mutale@saveserve.org",
      specialty: "NURSE",
      licenseNo: "ZNC-2023-001",
      location: "Lusaka, Chilenje",
      bio: "Community health nurse with 8 years of experience in maternal and child health.",
    },
    {
      name: "Mr. Chisomo Phiri",
      email: "chisomo@saveserve.org",
      specialty: "PHARMACIST",
      licenseNo: "ZPC-2022-045",
      location: "Ndola, Kansenshi",
      bio: "Registered pharmacist specialising in chronic disease medication management.",
    },
    {
      name: "Ms. Thandiwe Mwanza",
      email: "thandiwe@saveserve.org",
      specialty: "PHYSIOTHERAPIST",
      licenseNo: "ZPT-2021-012",
      location: "Lusaka, Woodlands",
      bio: "Physiotherapist focused on post-surgical rehabilitation and sports injuries.",
    },
    {
      name: "Sr. Natasha Tembo",
      email: "natasha@saveserve.org",
      specialty: "NURSE",
      licenseNo: "ZNC-2020-089",
      location: "Kitwe, Wusakile",
      bio: "Experienced nurse in wound care, immunisation, and home-based care services.",
    },
    {
      name: "Mr. Joseph Mulenga",
      email: "joseph@saveserve.org",
      specialty: "PHARMACIST",
      licenseNo: "ZPC-2019-077",
      location: "Livingstone, Maramba",
      bio: "Community pharmacist providing medication counselling and malaria treatment.",
    },
    {
      name: "Ms. Grace Kafwimbe",
      email: "grace@saveserve.org",
      specialty: "PHYSIOTHERAPIST",
      licenseNo: "ZPT-2023-003",
      location: "Lusaka, Kabulonga",
      bio: "Paediatric physiotherapist helping children with developmental movement delays.",
    },
  ];

  const password = await bcrypt.hash("password123", 12);

  for (const p of practitioners) {
    const existing = await prisma.user.findUnique({ where: { email: p.email } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        password,
        role: "PRACTITIONER",
        tier: "BASIC",
        practitioner: {
          create: {
            specialty: p.specialty,
            licenseNo: p.licenseNo,
            location: p.location,
            bio: p.bio,
            isVerified: true,
          },
        },
      },
    });
    console.log(`  ✓ ${p.name}`);
  }

  // ─── Practitioner availability ──────────────────────────────────────────────
  // Mon–Fri 08:00–17:00, Sat 09:00–13:00, Sun off. update: {} keeps any edits made in the app.
  const weeklyHours: Record<number, { startTime: string; endTime: string; isActive: boolean }> = {
    0: { startTime: "09:00", endTime: "13:00", isActive: false },
    1: { startTime: "08:00", endTime: "17:00", isActive: true },
    2: { startTime: "08:00", endTime: "17:00", isActive: true },
    3: { startTime: "08:00", endTime: "17:00", isActive: true },
    4: { startTime: "08:00", endTime: "17:00", isActive: true },
    5: { startTime: "08:00", endTime: "17:00", isActive: true },
    6: { startTime: "09:00", endTime: "13:00", isActive: true },
  };

  for (const prac of await prisma.practitioner.findMany({ select: { id: true } })) {
    for (const [day, hours] of Object.entries(weeklyHours)) {
      const dayOfWeek = Number(day);
      await prisma.availability.upsert({
        where: { practitionerId_dayOfWeek: { practitionerId: prac.id, dayOfWeek } },
        update: {},
        create: { practitionerId: prac.id, dayOfWeek, ...hours },
      });
    }
  }
  console.log("  ✓ Practitioner availability");

  // ─── Demo patients (one per tier) ──────────────────────────────────────────
  const patients = [
    { name: "Demo Patient", email: "demo@saveserve.org", phone: "+260971000001", tier: "BASIC" },
    { name: "Mwila Chanda (Free tier)", email: "free@saveserve.org", phone: "+260971000002", tier: "FREE" },
    { name: "Bwalya Mumba (Premium tier)", email: "premium@saveserve.org", phone: "+260971000003", tier: "PREMIUM" },
  ];

  for (const p of patients) {
    if (await prisma.user.findUnique({ where: { email: p.email } })) continue;
    await prisma.user.create({
      data: { ...p, password, role: "PATIENT", patient: { create: {} } },
    });
    console.log(`  ✓ ${p.name}`);
  }

  // ─── Demo admin ───────────────────────────────────────────────────────────
  if (!(await prisma.user.findUnique({ where: { email: "admin@saveserve.org" } }))) {
    await prisma.user.create({
      data: {
        name: "System Administrator",
        email: "admin@saveserve.org",
        password,
        role: "ADMIN",
        tier: "BASIC",
      },
    });
    console.log("  ✓ System Administrator");
  }

  // ─── Demo NGO ─────────────────────────────────────────────────────────────
  if (!(await prisma.user.findUnique({ where: { email: "ngo@saveserve.org" } }))) {
    await prisma.user.create({
      data: {
        name: "Zambia Health Foundation",
        email: "ngo@saveserve.org",
        password,
        role: "NGO",
        tier: "PREMIUM",
        ngo: { create: { name: "Zambia Health Foundation", fundBalance: 5000 } },
      },
    });
    console.log("  ✓ Zambia Health Foundation (NGO)");
  }

  // ─── Fund ledger opening balances ──────────────────────────────────────────
  // Pools that predate the ledger get one OPENING entry so they reconcile from here on.
  const ngos = await prisma.nGO.findMany({ include: { _count: { select: { fundTransactions: true } } } });
  for (const ngo of ngos) {
    if (ngo._count.fundTransactions > 0 || ngo.fundBalance === 0) continue;
    await prisma.fundTransaction.create({
      data: { ngoId: ngo.id, type: "OPENING", amount: ngo.fundBalance, note: "Opening balance (pre-ledger)" },
    });
    console.log(`  ✓ Ledger opening balance for ${ngo.name}: ZMW ${ngo.fundBalance.toFixed(2)}`);
  }

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());
