
## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript + React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | SQLite (dev) via Prisma 5 |
| Auth | NextAuth v5 (Credentials + JWT) |
| Icons | lucide-react |
| USSD Gateway | Africa's Talking API |

---

## System Roles

- **Patient** — Books via web PWA or USSD `*384#`; views health records and billing
- **Medical Officer (Practitioner)** — Web Command Centre dashboard; manages schedule and EHR records
- **Admin** — System-wide user and policy management

---

## Getting Started

```bash
cd save-serve
npm install

# Set environment variables
cp .env.example .env     # Set DATABASE_URL and NEXTAUTH_SECRET

# Push schema and seed demo data
npx prisma db push
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

Demo credentials (after seeding):

| Role | Email | Password |
|---|---|---|
| Patient | demo@saveserve.org | password123 |
| Practitioner | nurse.banda@saveserve.org | password123 |

---

## Project Structure

```
save-serve/
├── app/
│   ├── (auth)/          # Login + Register pages
│   ├── (patient)/       # Patient dashboard, appointments, records, billing
│   ├── (practitioner)/  # Medical Officer Command Centre
│   ├── (ngo)/           # NGO dashboard
│   ├── api/             # REST endpoints (auth, appointments, practitioners)
│   ├── about/           # Research proposal summary page
│   ├── patients/        # Public patients info page
│   ├── contact/         # Contact page
│   └── page.tsx         # Landing page
├── components/
│   ├── Navbar.tsx            # Public navigation
│   └── DashboardSidebar.tsx  # Role-aware dashboard nav
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── constants.ts      # Role/Tier/Status enums (SQLite-safe)
│   └── prisma.ts         # Prisma client singleton
├── prisma/
│   ├── schema.prisma     # Full data model
│   └── seed.ts           # Demo data seeder
└── proxy.ts              # Route protection (Next.js 16 middleware)
```

---

## Theoretical Foundation

This system is grounded in four academic frameworks:

1. **Digital Divide Theory** — Medium-Agnostic Design ensures the Policy Guardian serves all patients with equal clinical integrity regardless of hardware
2. **Socio-Technical Systems Theory** — PCOS bridges social equity policy and technical execution within a functioning hospital
3. **Health Equity Theory** *(Farantos et al., 2025)* — The Robin Hood Model implements closed-loop cross-subsidization as hard-coded software logic
4. **Information Systems Continuity Theory** — USSD acts as a Resilience Layer independent of internet connectivity

---

*© 2026 Patson Tembo · Information and Communication University (ICU) · BSc Information and Communications Technology*
