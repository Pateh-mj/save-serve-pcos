/**
 * End-to-end smoke test of the full demo against a running server.
 *
 *   BASE_URL=http://localhost:3000 npm run smoke
 *
 * Needs a seeded database (npm run db:seed). Uses a fresh random phone number and:
 *   USSD register → USSD book with triage → practitioner confirms → completes with EHR
 *   → patient sees record, subsidised bill and rates the visit (USSD) → admin reclassifies
 *   the patient as PREMIUM → USSD premium booking, payment and cancellation → dropped-session
 *   resume → SMS log → data-integrity checks.
 *
 * Afterwards it deletes everything it created (scripts/test-data.ts) so the demo database stays
 * clean; set SMOKE_KEEP_DATA=1 to keep the test patient for inspection.
 *
 * Safety: aborts if the server sends real SMS without an allowlist, because the random test
 * number could belong to a real person. Override with SMOKE_ALLOW_LIVE_SMS=1.
 */

import { PrismaClient } from "@prisma/client";
import { cleanTestData } from "./test-data";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const PASSWORD = process.env.SMOKE_PASSWORD ?? "password123";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "admin@saveserve.org";

// Seeded practitioners (prisma/seed.ts) — USSD shows names, login needs emails
const PRACTITIONER_EMAILS: Record<string, string> = {
  "Sr. Mutale Banda": "mutale@saveserve.org",
  "Mr. Chisomo Phiri": "chisomo@saveserve.org",
  "Ms. Thandiwe Mwanza": "thandiwe@saveserve.org",
  "Sr. Natasha Tembo": "natasha@saveserve.org",
  "Mr. Joseph Mulenga": "joseph@saveserve.org",
  "Ms. Grace Kafwimbe": "grace@saveserve.org",
};

const startedAt = new Date();
const phone = `+26097${Math.floor(1_000_000 + Math.random() * 9_000_000)}`;
const diagnosis = `Smoke diagnosis ${Date.now()}`;
// Book path prefix: 1 Book · 1 Fever · 2 No danger signs · 2 Unwell 1-3 days
const TRIAGE_PREFIX = "1*1*2*2";

// ─── Reporting ───────────────────────────────────────────────────────────────

const results: { step: string; ok: boolean; detail: string; ms: number }[] = [];

class StepFailure extends Error {}

async function step<T>(name: string, fn: () => Promise<{ value: T; detail: string }>): Promise<T> {
  const started = Date.now();
  try {
    const { value, detail } = await fn();
    const ms = Date.now() - started;
    results.push({ step: name, ok: true, detail, ms });
    console.log(`PASS  ${name} — ${detail} (${ms} ms)`);
    return value;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    results.push({ step: name, ok: false, detail, ms: Date.now() - started });
    console.log(`FAIL  ${name} — ${detail}`);
    throw new StepFailure(name);
  }
}

function expect(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── HTTP helpers ────────────────────────────────────────────────────────────

/** One USSD hop. Without sessionId the gateway is stateless (path-only); with one it tracks the session. */
async function ussd(text: string, sessionId?: string) {
  const res = await fetch(`${BASE_URL}/api/ussd`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, serviceCode: "*384#", phoneNumber: phone, text }),
  });
  const raw = await res.text();
  expect(res.ok, `USSD "${text}" returned HTTP ${res.status}: ${raw.slice(0, 120)}`);
  expect(/^(CON|END) /.test(raw), `USSD "${text}" returned a non-USSD body: ${raw.slice(0, 120)}`);
  expect(raw.length <= 186, `USSD "${text}" screen is ${raw.length - 4} chars (limit 182)`);
  return { end: raw.startsWith("END "), body: raw.slice(4) };
}

/** Numbered menu lines ("1. Foo") → ["Foo", ...] */
function menuItems(body: string) {
  return body
    .split("\n")
    .map((l) => l.match(/^\d+\.\s+(.*)$/)?.[1])
    .filter((x): x is string => Boolean(x));
}

/**
 * Walks the USSD booking menus after the triage prefix, searching
 * service × practitioner for the first open day/time, and confirms it.
 */
async function bookViaUssd() {
  const services = menuItems((await ussd(TRIAGE_PREFIX)).body);
  expect(services.length > 0, "no services offered");

  for (let s = 1; s <= services.length; s++) {
    const practitioners = menuItems((await ussd(`${TRIAGE_PREFIX}*${s}`)).body);
    for (let p = 1; p <= practitioners.length; p++) {
      const path = `${TRIAGE_PREFIX}*${s}*${p}`;
      const days = await ussd(path);
      if (days.end) continue; // no free slots in the next 7 days
      const times = await ussd(`${path}*1`);
      const slot = menuItems(times.body)[0];

      const confirm = await ussd(`${path}*1*1`);
      expect(/Fee: ZMW/.test(confirm.body), `confirm screen should show the fee, got: ${confirm.body}`);
      expect(/Priority: (ROUTINE|URGENT|EMERGENCY)/.test(confirm.body), `confirm screen should show triage priority, got: ${confirm.body}`);

      const booked = await ussd(`${path}*1*1*1`);
      expect(/^Booked!/.test(booked.body), `booking failed: ${booked.body}`);
      return {
        practitionerName: practitioners[p - 1],
        slot,
        fee: Number(confirm.body.match(/Fee: ZMW ([\d.]+)/)?.[1] ?? NaN),
        confirmScreen: confirm.body,
      };
    }
  }
  throw new Error("no open slot in the next 7 days for any practitioner (seeded hours: Mon–Sat)");
}

/** Minimal cookie jar so a NextAuth session survives between requests. */
class Session {
  private cookies = new Map<string, string>();

  private store(res: Response) {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      this.cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1));
    }
  }

  async fetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (this.cookies.size) {
      headers.set("Cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    }
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, redirect: "manual" });
    this.store(res);
    return res;
  }

  async login(email: string, password: string) {
    const csrfRes = await this.fetch("/api/auth/csrf");
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
    await this.fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken, email, password, callbackUrl: `${BASE_URL}/` }),
    });
    const me = await (await this.fetch("/api/auth/session")).json();
    return me?.user as { id: string; role: string } | undefined;
  }

  async json<T>(path: string, init: RequestInit = {}) {
    const res = await this.fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body: body as T };
  }
}

type Appointment = {
  id: string;
  status: string;
  patientId: string;
  channel: string;
  triageLevel: string;
  symptoms: string;
  patient: { user: { id: string; phone: string | null } };
  billing: { status: string; discountedAmount: number | null } | null;
};

// ─── The demo ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Smoke test against ${BASE_URL} with USSD phone ${phone}\n`);
  const admin = new Session();
  const practitioner = new Session();

  await step("Server reachable", async () => {
    const res = await fetch(`${BASE_URL}/api/practitioners`);
    expect(res.ok, `GET /api/practitioners returned HTTP ${res.status}`);
    const list = (await res.json()) as unknown[];
    expect(list.length > 0, "no verified practitioners — run npm run db:seed");
    return { value: null, detail: `${list.length} verified practitioners` };
  });

  await step("Admin login + SMS safety check", async () => {
    const user = await admin.login(ADMIN_EMAIL, PASSWORD);
    expect(user?.role === "ADMIN", `admin login failed for ${ADMIN_EMAIL} — run npm run db:seed`);
    const { body } = await admin.json<{ config: { driver: string; allowlistSize: number } }>("/api/admin/sms");
    const live = body.config.driver === "http";
    expect(
      !live || body.config.allowlistSize > 0 || process.env.SMOKE_ALLOW_LIVE_SMS === "1",
      "server sends REAL SMS with no SMS_ALLOWLIST — random test numbers could be real people. Set an allowlist or SMOKE_ALLOW_LIVE_SMS=1"
    );
    return { value: null, detail: `SMS driver: ${body.config.driver}${live ? ` (allowlist ${body.config.allowlistSize})` : ""}` };
  });

  await step("USSD register", async () => {
    const welcome = await ussd("");
    expect(/not registered/i.test(welcome.body), `expected registration prompt, got: ${welcome.body}`);
    const ask = await ussd("1");
    expect(/full name/i.test(ask.body), `expected name prompt, got: ${ask.body}`);
    const done = await ussd("1*Smoke Tester");
    expect(done.end && /registration complete/i.test(done.body), `unexpected reply: ${done.body}`);
    const menu = await ussd("");
    expect(/Book a visit/.test(menu.body), `registered user should see main menu, got: ${menu.body}`);
    return { value: null, detail: "new FREE-tier patient sees the main menu" };
  });

  const first = await step("USSD book with symptom triage", async () => {
    const triage = await ussd("1*1");
    expect(/danger signs/i.test(triage.body), `expected danger-sign question, got: ${triage.body}`);
    const b = await bookViaUssd();
    return { value: b, detail: `${b.practitionerName}, ${b.slot}, fee ZMW ${b.fee.toFixed(2)}` };
  });

  const email = PRACTITIONER_EMAILS[first.practitionerName];

  await step("Practitioner login", async () => {
    expect(email, `no seeded email known for "${first.practitionerName}"`);
    const user = await practitioner.login(email, PASSWORD);
    expect(user?.role === "PRACTITIONER", `login as ${email} failed (session: ${JSON.stringify(user)})`);
    return { value: null, detail: email };
  });

  const appt = await step("Practitioner sees triaged USSD booking", async () => {
    const { status, body } = await practitioner.json<Appointment[]>("/api/appointments");
    expect(status === 200, `GET /api/appointments returned ${status}`);
    const found = body.find((a) => a.patient.user.phone === phone && a.status === "PENDING");
    expect(found, "pending appointment for the USSD patient not found");
    expect(found.channel === "USSD", `expected channel USSD, got ${found.channel}`);
    expect(found.symptoms.includes("FEVER"), `expected FEVER in symptoms, got "${found.symptoms}"`);
    expect(found.billing, "appointment has no billing record");
    return { value: found, detail: `triage ${found.triageLevel}, billing ${found.billing.status}` };
  });

  await step("Practitioner confirms", async () => {
    const { status, body } = await practitioner.json<Appointment & { error?: string }>("/api/appointments", {
      method: "PATCH",
      body: JSON.stringify({ appointmentId: appt.id, status: "CONFIRMED" }),
    });
    expect(status === 200, `PATCH returned ${status}: ${body.error ?? ""}`);
    expect(body.status === "CONFIRMED", `status is ${body.status}`);
    return { value: null, detail: "PENDING → CONFIRMED" };
  });

  await step("Practitioner completes with EHR + follow-up", async () => {
    const followUp = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    const { status, body } = await practitioner.json<{ id?: string; error?: string }>("/api/ehr", {
      method: "POST",
      body: JSON.stringify({
        patientId: appt.patientId,
        appointmentId: appt.id,
        diagnosis,
        prescription: "Paracetamol 500mg TDS x 3 days",
        notes: "Created by scripts/smoke-test.ts",
        followUpDate: followUp,
      }),
    });
    expect(status === 201, `POST /api/ehr returned ${status}: ${body.error ?? ""}`);

    const list = await practitioner.json<Appointment[]>("/api/appointments");
    const after = list.body.find((a) => a.id === appt.id);
    expect(after?.status === "COMPLETED", `appointment status after EHR is ${after?.status}`);
    return { value: null, detail: `EHR ${body.id}, follow-up ${followUp}` };
  });

  await step("Patient views record (USSD 3)", async () => {
    const records = await ussd("3");
    expect(records.body.includes(diagnosis), `record not shown, got: ${records.body}`);
    return { value: null, detail: "diagnosis visible from a feature phone" };
  });

  await step("Patient views subsidised bill (USSD 4)", async () => {
    const bills = await ussd("4");
    expect(/subsidies received: ZMW/i.test(bills.body), `unexpected billing screen: ${bills.body}`);
    return { value: null, detail: bills.body.replace(/\n/g, " ") };
  });

  await step("Patient rates the visit (USSD 5)", async () => {
    const prompt = await ussd("5");
    expect(/Rate your visit/.test(prompt.body), `expected rating prompt, got: ${prompt.body}`);
    const saved = await ussd("5*5");
    expect(/thank you/i.test(saved.body), `rating not saved: ${saved.body}`);
    return { value: null, detail: "rated 5 (Excellent)" };
  });

  await step("Admin reclassifies patient as PREMIUM", async () => {
    const { status, body } = await admin.json<{ tier?: string; error?: string }>(`/api/admin/users/${appt.patient.user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ tier: "PREMIUM" }),
    });
    expect(status === 200 && body.tier === "PREMIUM", `tier update failed (${status}): ${body.error ?? ""}`);
    return { value: null, detail: "Policy Guardian now bills this patient at the premium rate" };
  });

  const premium = await step("USSD premium booking (Robin Hood surplus)", async () => {
    const b = await bookViaUssd();
    expect(b.fee > first.fee, `premium fee ZMW ${b.fee} should exceed the subsidised fee ZMW ${first.fee}`);
    return { value: b, detail: `${b.practitionerName}, ${b.slot}, fee ZMW ${b.fee.toFixed(2)}` };
  });

  await step("Patient pays via USSD mobile money (USSD 4)", async () => {
    const list = await ussd("4");
    expect(/Unpaid bills/.test(list.body), `expected unpaid bill list, got: ${list.body}`);
    const methods = await ussd("4*1");
    expect(/Airtel Money/.test(methods.body), `expected payment methods, got: ${methods.body}`);
    const confirm = await ussd("4*1*1");
    expect(/Pay ZMW/.test(confirm.body), `expected payment confirmation, got: ${confirm.body}`);
    const paid = await ussd("4*1*1*1");
    expect(/Payment of ZMW [\d.]+ received/.test(paid.body), `payment failed: ${paid.body}`);
    return { value: null, detail: paid.body.split(".")[0] + `.${paid.body.split(".")[1]}` };
  });

  await step("Patient cancels via USSD (USSD 2)", async () => {
    const list = await ussd("2");
    expect(/Your visits/.test(list.body), `expected visit list, got: ${list.body}`);
    const details = await ussd("2*1");
    expect(/Cancel this visit/.test(details.body), `expected manage screen, got: ${details.body}`);
    await ussd("2*1*1");
    const done = await ussd("2*1*1*1");
    expect(/cancelled/i.test(done.body), `cancel failed: ${done.body}`);
    return { value: null, detail: `${premium.practitionerName} visit cancelled` };
  });

  await step("Dropped session resumes on redial", async () => {
    const dropped = `SMOKE-A-${Date.now()}`;
    for (const t of ["", "1", "1*1", "1*1*2", TRIAGE_PREFIX]) await ussd(t, dropped);
    // …network drops here: no END was ever sent for this session
    const redial = `SMOKE-B-${Date.now()}`;
    const offer = await ussd("", redial);
    expect(/unfinished booking/i.test(offer.body), `expected resume offer, got: ${offer.body}`);
    const resumed = await ussd("1", redial);
    expect(/Choose a service/.test(resumed.body), `expected to continue at service choice, got: ${resumed.body}`);
    await ussd("2", `SMOKE-C-${Date.now()}`); // touch nothing else; leave the menus
    return { value: null, detail: "redial offered 'Continue booking' and skipped 4 answered steps" };
  });

  await step("SMS notifications recorded", async () => {
    const wanted = ["WELCOME", "BOOKED", "CONFIRMED", "COMPLETED", "PAYMENT", "CANCELLED"];
    let purposes = new Set<string>();
    for (let i = 0; i < 10; i++) {
      // Notifications run after each response; give the last ones a moment
      const { body } = await admin.json<{ messages: { purpose: string }[] }>(`/api/admin/sms?to=${encodeURIComponent(phone)}`);
      purposes = new Set(body.messages.map((m) => m.purpose));
      if (wanted.every((w) => purposes.has(w))) break;
      await sleep(1000);
    }
    const missing = wanted.filter((w) => !purposes.has(w));
    expect(missing.length === 0, `missing SMS for: ${missing.join(", ")}`);
    return { value: null, detail: `${[...purposes].join(", ")}` };
  });

  await step("Every role's pages render", async () => {
    const portals: [string, string, string[]][] = [
      ["patient", "demo@saveserve.org", ["/patient/dashboard", "/patient/appointments/new", "/patient/appointments", "/patient/records", "/patient/billing", "/patient/profile"]],
      ["practitioner", email, ["/practitioner/dashboard", "/practitioner/schedule", "/practitioner/patients", `/practitioner/patients/${appt.patientId}`, "/practitioner/records", "/practitioner/profile"]],
      ["NGO", "ngo@saveserve.org", ["/ngo/dashboard", "/ngo/funding", "/ngo/beneficiaries", "/ngo/impact", "/ngo/profile"]],
      ["admin", ADMIN_EMAIL, ["/admin/dashboard", "/admin/appointments", "/admin/users", "/admin/policies", "/admin/sms", "/admin/evaluation", "/admin/account"]],
    ];
    const publicPages = ["/", "/about", "/patients", "/ngos", "/contact", "/ussd", "/login", "/register"];
    let count = 0;

    for (const path of publicPages) {
      const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
      expect(res.status === 200, `public page ${path} returned HTTP ${res.status}`);
      count++;
    }
    for (const [label, login, pages] of portals) {
      const s = new Session();
      const user = await s.login(login, PASSWORD);
      expect(user, `${label} login failed for ${login}`);
      for (const path of pages) {
        const res = await s.fetch(path);
        expect(res.status === 200, `${label} page ${path} returned HTTP ${res.status}${res.headers.get("location") ? ` → ${res.headers.get("location")}` : ""}`);
        count++;
      }
    }
    return { value: null, detail: `${count} pages across the public site and 4 role portals` };
  });

  await step("Data-integrity checks pass", async () => {
    const { status, body } = await admin.json<{ checks: { name: string; passed: boolean; informational?: boolean; detail: string }[] }>(
      "/api/admin/evaluation"
    );
    expect(status === 200, `GET /api/admin/evaluation returned ${status}`);
    const failing = body.checks.filter((c) => !c.passed && !c.informational);
    expect(failing.length === 0, failing.map((c) => `${c.name}: ${c.detail}`).join("; "));
    return { value: null, detail: `${body.checks.length} checks, ledger reconciles` };
  });
}

main()
  .catch((err) => {
    if (!(err instanceof StepFailure)) {
      console.log(`FAIL  Unexpected error — ${err instanceof Error ? err.message : err}`);
      results.push({ step: "Unexpected error", ok: false, detail: String(err), ms: 0 });
    }
  })
  .finally(async () => {
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} steps passed${failed ? " — stopped at first failure" : ""}`);
    process.exitCode = failed ? 1 : 0;

    if (process.env.SMOKE_KEEP_DATA === "1") return;
    const prisma = new PrismaClient();
    try {
      const r = await cleanTestData(prisma, { phones: [phone], metricsSince: startedAt });
      console.log(`Cleaned up: ${r.users} test user(s), ${r.ledger} ledger entr(ies), ${r.sms} SMS, ${r.sessions} USSD session(s), ${r.metrics} timing(s)`);
    } catch (err) {
      console.log(`Cleanup failed — run npm run db:clean (${err instanceof Error ? err.message : err})`);
    } finally {
      await prisma.$disconnect();
    }
  });
