# PCOS — SaveServe

**Patient-Centric Orchestration System for Healthcare Resource Equity Using Robin Hood Subsidization and Multi-Channel Access**

> BSc ICT Final Year Project · School of Engineering · Information and Communications University (ICU) · 2026
> **Author:** Patson Tembo · **Advisor:** Mr Billy Munyenyembe

SaveServe connects patients with their clinic's practitioners through two channels that share one database:
a web app (installable PWA) for staff and smartphone users, and a USSD menu (`*384#`) that works on any
feature phone without internet. The **Policy Guardian** applies tier-based billing and the **Robin Hood**
cross-subsidy on every booking, whichever channel it came from.

---

## What the prototype does

| Report objective | Where it lives |
|---|---|
| Patient registration (web + USSD) | `/register`, USSD option *Register* |
| Symptom-based triage | `lib/triage.ts` — web booking step 1, USSD booking questions, practitioner queue sorted by priority |
| Appointment scheduling | Practitioner weekly hours → 30-min slots (`lib/availability.ts`), double-booking prevented by a DB lock |
| Policy Guardian & Robin Hood billing | `lib/policy-guardian.ts`, `lib/booking.ts`, `lib/billing.ts` — FREE visits funded by NGO pools, PREMIUM surplus credited to the pool on payment |
| Auditable NGO funds | `lib/ledger.ts` — every pool movement is a `FundTransaction`; balances reconcile |
| EHR | Practitioners record diagnosis, prescription, notes and follow-up date; patients view on web or USSD |
| USSD gateway | `lib/ussd.ts` (Africa's Talking protocol): book, view/cancel visits, records, pay bills, rate visits, emergency advice; resumes dropped sessions |
| SMS notifications | `lib/sms.ts`, `lib/notifications.ts` — booking, confirmation, cancellation, completion, payment, reminders, practitioner alerts for urgent cases |
| Administration | `/admin` — tier classification, practitioner verification, policy & fee settings, SMS console |
| Evaluation (objective 4) | `/admin/evaluation` — response times (p50/p95), SMS delivery, USSD funnel, satisfaction, data-integrity checks, CSV export |

## Demo accounts (after `npm run db:seed`)

All passwords: `password123`

| Role | Email | Notes |
|---|---|---|
| Admin | admin@saveserve.org | Users, policies, SMS, evaluation |
| Practitioner | mutale@saveserve.org | Also chisomo@, thandiwe@, natasha@, joseph@, grace@ |
| Patient (BASIC) | demo@saveserve.org | USSD phone +260971000001 |
| Patient (FREE) | free@saveserve.org | USSD phone +260971000002 — fully subsidised |
| Patient (PREMIUM) | premium@saveserve.org | USSD phone +260971000003 — pays the Robin Hood surplus |
| NGO | ngo@saveserve.org | Pool top-ups, subsidised visits, fund ledger |

## Running locally

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, DIRECT_URL and AUTH_SECRET
npx prisma db push            # create/update tables in Supabase
npm run db:seed               # demo users, policies, practitioner hours
npm run dev                   # http://localhost:3000
```

The USSD simulator is at `/ussd` (and in a modal on the landing page). Type replies on your keyboard;
**End** hangs up like a dropped network, and redialling offers to resume an unfinished booking.

## SMS provider

SMS goes through `lib/sms.ts`. By default `SMS_DRIVER=log` records messages without sending them. To send
real SMS through any HTTP bulk-SMS API, set `SMS_DRIVER=http` and describe the provider's API in env
variables. Placeholders `{to}`, `{message}`, `{sender}` are filled in and URL- or JSON-encoded as needed:

```bash
SMS_DRIVER=http
SMS_SENDER_ID=SaveServe
SMS_HTTP_METHOD=POST
SMS_HTTP_URL=https://provider.example/api/v1/sms
SMS_HTTP_HEADERS={"Authorization":"Bearer YOUR_KEY"}
SMS_HTTP_CONTENT_TYPE=application/json
SMS_HTTP_BODY={"to":"{to}","message":"{message}","sender":"{sender}"}
SMS_PHONE_FORMAT=intl          # 260971234567 — or e164 (+260…) / local (097…)
SMS_ALLOWLIST=0971234567       # while set, ONLY these numbers get real SMS
```

Credit guards: `SMS_ALLOWLIST` (only listed numbers receive real SMS while it is set) and
`SMS_DAILY_LIMIT_PER_NUMBER` (default 10). Messages are kept to one 160-character GSM segment.
Verify the integration from **Admin → SMS Gateway → Send test SMS**; every message, cost in segments and
provider error is logged there. If the provider supports delivery reports, set `SMS_HTTP_ID_FIELD` and point
its callback at `https://<host>/api/sms/status?token=<SMS_CALLBACK_TOKEN>`.

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Add the environment variables from `.env.example` (at minimum `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`,
   `NEXTAUTH_URL` set to the Vercel URL, and `CRON_SECRET`; plus the `SMS_*` values when going live).
3. Deploy. `vercel.json` pins functions to London (`lhr1`, next to the Supabase `eu-west-2` database, which
   keeps USSD screens fast) and schedules the reminder job daily at 08:00 Lusaka time.
4. Optional, for a real `*384#` session: in the Africa's Talking sandbox, create a USSD channel with callback
   `https://<host>/api/ussd`.

## Testing

```bash
BASE_URL=http://localhost:3000 npm run smoke
```

`scripts/smoke-test.ts` runs the whole demo against a running server with a fresh random phone number:
USSD registration → triaged booking → practitioner confirm → EHR with follow-up → patient views record and
subsidised bill and rates the visit → admin reclassifies the patient as PREMIUM → premium booking, USSD
payment and cancellation → dropped-session resume → SMS trail → data-integrity checks. It prints PASS/FAIL
per step and refuses to run against a server that would send real SMS without an allowlist.

## Project structure

```
app/
  (auth)/          login, register
  (patient)/       dashboard, book a visit (with triage), appointments, records, billing, profile & SMS history
  (practitioner)/  triage queue, schedule & availability, patients → patient chart, EHR records, profile
  (ngo)/           dashboard, funding & ledger, beneficiaries (abbreviated identities), impact report, organisation
  (admin)/         overview, appointments, users & tiers, Policy Guardian settings, SMS gateway, evaluation, account
  about/ patients/ ngos/ contact/   public pages; research content comes from lib/research.ts (mirrors the report)
  api/             REST endpoints (appointments, billing, ehr, ngo, ussd, sms, cron, admin, feedback)
  ussd/            USSD simulator page
lib/
  policy-guardian.ts  tier pricing, NGO sponsorship, monthly free-visit cap
  booking.ts          shared booking path for web and USSD
  appointments.ts     status transitions and cancellation refunds
  billing.ts          payment and Robin Hood credit
  ledger.ts           NGO fund movements
  triage.ts           symptom triage rules
  ussd.ts             USSD menu engine and session resume
  sms.ts              SMS drivers and credit guards
  notifications.ts    SMS templates and reminder job
  evaluation.ts       response-time, integrity and satisfaction metrics
prisma/
  schema.prisma, seed.ts
scripts/
  smoke-test.ts
```

## Theoretical foundation

As set out in Chapter 2 of the report:

1. **Robin Hood Business Model** (Prahalad & Hart, 2002) — premium-tier revenue cross-subsidises care for
   low-income patients; implemented as the Policy Guardian and the NGO fund pools.
2. **Diffusion of Innovations** (Rogers, 1962) — compatibility and simplicity drive adoption; implemented as two
   access channels sized to users' devices (USSD for feature phones, a web app for staff and smartphones).
