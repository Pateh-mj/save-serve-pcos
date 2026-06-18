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

  // ─── Demo patient ─────────────────────────────────────────────────────────
  if (!(await prisma.user.findUnique({ where: { email: "demo@saveserve.org" } }))) {
    await prisma.user.create({
      data: {
        name: "Demo Patient",
        email: "demo@saveserve.org",
        phone: "+260971000001",
        password,
        role: "PATIENT",
        tier: "BASIC",
        patient: { create: {} },
      },
    });
    console.log("  ✓ Demo Patient");
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

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());
