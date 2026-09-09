# Implementation Plan v2 — SaveServe Core Logic, Auth & USSD Engine

Build and connect all core backend logic for SaveServe (PCOS): database + authentication first, then the Policy Guardian/billing/appointments/EHR business logic, then the USSD engine (Africa's Talking protocol + interactive web simulator) built on top of that same logic.

Changes from v1: Postgres/Supabase replaces SQLite; `proxy.ts` is fixed in place instead of being renamed to `middleware.ts`; Section 2 and Section 3 are swapped so the USSD engine is built on top of working business logic instead of ahead of it.

---

## 1. Database & Authentication Setup

### Database Configuration (Supabase/Postgres)
- Keep `schema.prisma` datasource provider as `postgresql` (this is already correct in the codebase — no rename needed).
- Add a `directUrl` alongside `url` in the datasource block, so migrations use Supabase's direct connection while the running app uses the pooled one:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")   // pooled, port 6543
    directUrl = env("DIRECT_URL")     // direct, port 5432
  }
  ```
- Set both `DATABASE_URL` (Transaction pooler, port 6543, `?pgbouncer=true`) and `DIRECT_URL` (Session/direct, port 5432) in `.env`, from Supabase → Project Settings → Database → Connection string.
- Add a Prisma Client singleton at `lib/prisma.ts` to avoid connection-pool exhaustion under Next.js dev hot-reload:
  ```ts
  import { PrismaClient } from "@prisma/client";
  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
  export const prisma = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  ```
- Run `npx prisma migrate dev --name init` (not `db push`) against Supabase to create a versioned migration history, then `npx tsx prisma/seed.ts` to seed practitioners, policies, and demo accounts.

### Authentication & Middleware
- Split auth config into an edge-safe file and a full file, so the proxy never pulls in the Prisma adapter (which needs Node APIs unavailable at the edge):
  - `auth.config.ts` — providers/callbacks only, no Prisma adapter, imported by `proxy.ts`.
  - `lib/auth.ts` — full config including the Prisma adapter, imported everywhere else (API routes, server components).
- **Fix `proxy.ts` in place — do not rename it to `middleware.ts`.** As of Next.js 16, `middleware.ts` was renamed to `proxy.ts`, and the file must export a function named `proxy` (or a default export). The codebase already has the correct filename; only its contents need updating for route protection and role-based redirects (`/patient/*`, `/practitioner/*`, `/ngo/*`, `/admin/*`).
- Add explicit server-side session checks inside protected route handlers and layouts, not just the proxy. Middleware-only session protection in Next.js has a known bypass (CVE-2025-29927, via a spoofed `x-middleware-subrequest` header) — this matters here because billing and EHR endpoints are in scope.
- Pin exact working versions of `next-auth`/`next` rather than installing "latest" — the v5/Next 16 peer-dependency range has caused install failures requiring `--legacy-peer-deps` for some combinations.
- Verify and test `app/api/auth/register/route.ts`, `app/(auth)/login/page.tsx`, and `app/(auth)/register/page.tsx` with validation and role profile creation (Patient, Practitioner, NGO).

---

## 2. Core Business Logic Endpoints & Dashboards

### Policy Guardian & Billing
- Create a single source of truth for subsidy logic at `lib/policy-guardian.ts`, imported by both the web booking flow and the USSD engine (Section 3) so the two channels never diverge:
  - Evaluates patient tier (`FREE`, `BASIC`, `PREMIUM`).
  - Applies NGO pool subsidies for `FREE` tier.
  - Records Robin Hood surplus contributions for `PREMIUM` tier.
  - Creates billing entries.
- Create `app/api/billing/route.ts` and `app/api/billing/pay/route.ts` to handle bill settlement.

### Appointments & Schedule
- Enhance `app/api/appointments/route.ts` for status transitions (`PENDING` → `CONFIRMED` → `COMPLETED` → `CANCELLED`).
- Connect practitioner appointment actions (accept, complete visit, cancel).

### EHR (Electronic Health Records)
- Create `app/api/ehr/route.ts` for practitioners to record clinical diagnosis, prescriptions, and visit notes after consultations. Enforce practitioner-only authorization on write.
- Connect patient records view to display clinical notes.

### Practitioner & NGO Portals
- Implement practitioner schedule management and patient EHR submission.
- Implement NGO fund management (top-up pool, track subsidized visits funded).

---

## 3. USSD Engine & Web Simulator

### USSD API Route (`/api/ussd`)
- Create `app/api/ussd/route.ts` compliant with the Africa's Talking USSD protocol (`sessionId`, `phoneNumber`, `networkCode`, `serviceCode`, `text`, with `CON`/`END` response formats).
- Design note: Africa's Talking's `text` parameter accumulates the full path of a session (e.g. `1*1*1*1`). Reconstruct the current step by splitting `text` on `*` on every request — do not persist an in-progress session object in the database. Reserve database writes for the final "Offline Sync" stub creation below.
- Implement the multi-step state machine, calling the Section 2 endpoints/functions directly (not reimplementing subsidy logic):
  1. **New User Onboarding**: if phone number is not found, offer quick registration (Name, Role).
  2. **Main Menu**:
     - `1` Book Appointment (Select Specialty → Select Practitioner → Select Date/Time → Policy Guardian Subsidy Calculation → Confirm)
     - `2` My Appointments (view active & upcoming appointments, status, practitioner)
     - `3` Health Records (view recent diagnoses, prescriptions, and notes)
     - `4` Billing & Subsidies (check balance, view applied Robin Hood subsidies)
     - `5` Health Tips & Emergency Contact
  3. **Offline Sync & Resilience**: create appointment & billing stubs with `channel: "USSD"` and auto-sync into the centralised database.

### Interactive USSD Phone Simulator
- Build a realistic Nokia/GSM feature-phone simulator component at `app/ussd/page.tsx`, plus an interactive modal on the landing page, where any visitor can dial `*384#`, interact in real time, test appointments, and see live results.

---

## Verification Plan

### Automated & API Verification
1. `npx prisma migrate dev --name init` — verify schema applies cleanly to Supabase/Postgres.
2. `npx tsx prisma/seed.ts` — seed demo users and policies.
3. Test Auth: register new patient/practitioner/NGO, sign in via `/login`, verify session cookies and redirection.
4. **Negative test**: while logged in as a patient, request a `/practitioner/*` route directly (and vice versa) — confirms the proxy fix actually blocks cross-role access, not just redirects on the happy path.
5. Test Policy Guardian/Billing/Appointments directly via their routes before wiring up USSD: book an appointment, verify a billing record is created with the correct subsidy and tier multiplier.
6. Test USSD API: send simulated POST requests with `text=""`, `text="1"`, `text="1*1*1*1"`, checking `CON`/`END` outputs and confirming the booking produces the same billing record shape as step 5.

### Manual / Browser Verification
1. Register a new user and log in via the web UI.
2. Test the USSD simulator at `/ussd` to dial `*384#`, register, and book an appointment.
3. Log in as the assigned practitioner (`nurse.banda@saveserve.org` / `password123`) to see the USSD-booked appointment and add an EHR diagnosis.
4. Log in as the patient to view the updated appointment status and EHR record.
