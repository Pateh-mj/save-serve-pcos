# Friday demo runbook

About 12 minutes. Each part names the report objective it proves. All passwords are `password123`.

## Before the day

1. **Deploy** to Vercel (README → *Deploying to Vercel*). Set `NEXTAUTH_URL` to the Vercel URL.
2. **SMS live, but fenced:** `SMS_DRIVER=http`, the provider settings from your colleague, and
   `SMS_ALLOWLIST` = your phone + a second phone (e.g. a friend in the room). Only those receive real SMS.
3. **Admin → Users → Practitioners:** set Sr. Mutale Banda's phone to the second phone, so urgent bookings alert it.
4. **Admin → SMS Gateway → Send test SMS** to both phones. Confirm both arrive.
5. Run the smoke test against the live URL: `BASE_URL=https://<your-app>.vercel.app npm run smoke` (19/19).
   It deletes its own test patient afterwards; `npm run db:clean` removes any leftovers.
6. **Sample activity (optional):** `npm run db:demo` adds 8 sample patients with eight weeks of visits so the
   charts, triage queue and NGO ledger have data. Say so if asked: it is generated, not field data. It writes no
   ratings, SMS or timings, so the Evaluation page stays real. Remove with `npm run db:demo -- --remove`.
7. **One-click sign-in (optional):** set `NEXT_PUBLIC_DEMO_LOGINS=1` and redeploy; the sign-in page then shows
   patient, practitioner, partner and admin buttons. Leave it off once the presentation is over.
8. Charge both phones; have a mobile hotspot as backup internet.
9. Open tabs: landing page, `/ussd`, and three logged-in windows (practitioner, admin, NGO) — use separate
   browser profiles or private windows so the sessions don't overwrite each other.

## The demo

**1. The problem (1 min) — landing page.** Two channels, one hospital system, Robin Hood billing.

**2. Feature-phone patient, no internet (2 min) — Objectives 1 & 3.** `/ussd` → type your own number in
*Your number* → **Use** → **Call**.
- Register with your name. *Your phone buzzes: welcome SMS.*
- `1` Book → `1` Fever → `2` no danger signs → `2` 1–3 days → service → practitioner → day → time.
- The confirm screen shows **Priority** (triage) and **Fee: ZMW 0.00 (100% NGO subsidy)** → `1`.
  *Booking SMS arrives.*

**3. Emergency triage (1 min).** Dial again → `1` → any problem → `1` danger signs. Point at the
emergency advice (call 991) → `1` also book → finish. *The second phone (practitioner) gets an EMERGENCY alert.*

**4. Practitioner Command Centre (2 min).** Log in as `mutale@saveserve.org`.
- The emergency visit sits at the top of the queue (red), with symptoms.
- **Accept Visit** on your routine booking → *"CONFIRMED" SMS.*
- **Complete Consultation & EHR** with a diagnosis, prescription and a follow-up date → *completion SMS.*

**5. Patient follow-through on USSD (1 min).** Dial → `3` health records (the diagnosis appears) → dial → `5` rate the visit.

**6. Robin Hood economics (2 min) — Objective 2.**
- Admin → **Users & Tiers** → set your patient to **PREMIUM**.
- USSD: book again — the fee is now **ZMW 300.00**. Then `4` → pay with Airtel Money → *receipt SMS.*
- NGO dashboard (`ngo@saveserve.org`) → **Fund Ledger**: −150 for the subsidised visit, +150 premium surplus,
  and the green *Balance reconciles with ledger* badge.
- Admin → **Policy Guardian**: change the PREMIUM multiplier — the next quote changes immediately.

**7. Resilience (1 min) — §1.9.** Start a booking, press **End** halfway (a dropped network), dial again →
*"You have an unfinished booking. 1. Continue"*.

**8. Evaluation (1 min) — Objective 4.** Admin → **Evaluation**: USSD response times (p50/p95), SMS
delivery rate, satisfaction, and every integrity check passing. CSV exports feed Chapter 4.

**9. PWA (30 s).** Install the app from the browser, switch on airplane mode, reload: the offline page
sends people to `*384#` — the two channels backing each other up.

## If something goes wrong

| Problem | Fallback |
|---|---|
| Venue Wi-Fi down | Phone hotspot. The database is in the cloud, so the app needs *some* internet. |
| SMS slow or not arriving | Admin → SMS Gateway shows every message and its status; the flow itself never waits for SMS. |
| A USSD screen says "Invalid selection" | Dial again — menus are rebuilt on every call. |
| Practitioner has no free slots | Choose another practitioner, or extend hours in Schedule. |
