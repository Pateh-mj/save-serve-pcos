import { prisma } from "@/lib/prisma";
import { formatPhoneFor, normalizeZambianPhone } from "@/lib/phone";
import { recordMetric } from "@/lib/metrics";

/**
 * Provider-agnostic SMS sending.
 *
 * SMS_DRIVER=log   (default) records the message without sending — safe for development.
 * SMS_DRIVER=http  sends through any HTTP bulk-SMS API, configured entirely by env:
 *
 *   SMS_HTTP_URL           e.g. https://provider.example/api/send?key=XYZ&to={to}&msg={message}
 *   SMS_HTTP_METHOD        GET | POST (default POST)
 *   SMS_HTTP_HEADERS       JSON object, e.g. {"Authorization":"Bearer XYZ"}
 *   SMS_HTTP_CONTENT_TYPE  application/json | application/x-www-form-urlencoded (default JSON)
 *   SMS_HTTP_BODY          body template, e.g. {"to":"{to}","message":"{message}","sender":"{sender}"}
 *   SMS_HTTP_SUCCESS       optional text/regex the response body must contain to count as sent
 *   SMS_HTTP_ID_FIELD      optional dot-path to the provider's message id in a JSON response
 *   SMS_PHONE_FORMAT       e164 (+260…) | intl (260…) | local (09…) — default intl
 *   SMS_SENDER_ID          sender name/number, available as {sender}
 *
 * Guards that protect paid credits:
 *   SMS_ALLOWLIST                 comma-separated numbers; when set, only these receive real SMS
 *   SMS_DAILY_LIMIT_PER_NUMBER    default 10
 */

export type SmsPurpose =
  | "WELCOME"
  | "BOOKED"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "PAYMENT"
  | "REMINDER"
  | "FOLLOW_UP"
  | "PRACTITIONER_ALERT"
  | "TEST";

interface SendSmsInput {
  to: string | null | undefined;
  message: string;
  purpose: SmsPurpose;
  appointmentId?: string;
  userId?: string;
}

interface DriverResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export function smsConfig() {
  const allowlist = (process.env.SMS_ALLOWLIST ?? "")
    .split(",")
    .map((n) => normalizeZambianPhone(n.trim()))
    .filter((n): n is string => Boolean(n));
  return {
    driver: (process.env.SMS_DRIVER ?? "log").toLowerCase() === "http" ? "http" : "log",
    senderId: process.env.SMS_SENDER_ID ?? "SaveServe",
    allowlist,
    dailyLimit: Number(process.env.SMS_DAILY_LIMIT_PER_NUMBER ?? 10),
    httpConfigured: Boolean(process.env.SMS_HTTP_URL),
  };
}

// ─── Encoding ────────────────────────────────────────────────────────────────
// A single non-GSM character (curly quote, em dash, "·") switches the whole message to
// UCS-2 and cuts a segment from 160 to 70 characters, so normalise to GSM-safe text.

const GSM_REPLACEMENTS: [RegExp, string][] = [
  [/[‘’‚′]/g, "'"],
  [/[“”„″]/g, '"'],
  [/[–—−]/g, "-"],
  [/[·•]/g, "-"],
  [/…/g, "..."],
  [/ /g, " "],
];

export function toGsmSafe(text: string) {
  let out = text;
  for (const [pattern, replacement] of GSM_REPLACEMENTS) out = out.replace(pattern, replacement);
  // Drop anything else outside printable ASCII + newline
  return out.replace(/[^\x20-\x7E\n]/g, "");
}

export function countSegments(text: string) {
  return text.length <= 160 ? 1 : Math.ceil(text.length / 153);
}

// ─── Drivers ─────────────────────────────────────────────────────────────────

function fillTemplate(template: string, values: Record<string, string>, encode: (v: string) => string) {
  return template.replace(/\{(to|message|sender)\}/g, (_, key: string) => encode(values[key] ?? ""));
}

function readPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

async function sendViaHttp(to: string, message: string, senderId: string): Promise<DriverResult> {
  const url = process.env.SMS_HTTP_URL;
  if (!url) return { ok: false, error: "SMS_HTTP_URL is not set" };

  const method = (process.env.SMS_HTTP_METHOD ?? "POST").toUpperCase();
  const contentType = process.env.SMS_HTTP_CONTENT_TYPE ?? "application/json";
  const format = (process.env.SMS_PHONE_FORMAT ?? "intl") as "e164" | "intl" | "local";
  const values = { to: formatPhoneFor(to, format), message, sender: senderId };

  let headers: Record<string, string> = {};
  try {
    headers = process.env.SMS_HTTP_HEADERS ? JSON.parse(process.env.SMS_HTTP_HEADERS) : {};
  } catch {
    return { ok: false, error: "SMS_HTTP_HEADERS is not valid JSON" };
  }

  const finalUrl = fillTemplate(url, values, encodeURIComponent);
  let body: string | undefined;
  if (method !== "GET" && process.env.SMS_HTTP_BODY) {
    const encode = contentType.includes("json")
      ? (v: string) => JSON.stringify(v).slice(1, -1) // escape inside an existing JSON string
      : encodeURIComponent;
    body = fillTemplate(process.env.SMS_HTTP_BODY, values, encode);
    headers["Content-Type"] = contentType;
  }

  const res = await fetch(finalUrl, { method, headers, body, signal: AbortSignal.timeout(15_000) });
  const text = await res.text();

  if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };

  const successPattern = process.env.SMS_HTTP_SUCCESS;
  if (successPattern && !new RegExp(successPattern, "i").test(text)) {
    return { ok: false, error: `Provider response did not match SMS_HTTP_SUCCESS: ${text.slice(0, 200)}` };
  }

  let providerMessageId: string | undefined;
  if (process.env.SMS_HTTP_ID_FIELD) {
    try {
      const id = readPath(JSON.parse(text), process.env.SMS_HTTP_ID_FIELD);
      if (id !== undefined && id !== null) providerMessageId = String(id);
    } catch {
      // Non-JSON response; the message still counts as sent
    }
  }
  return { ok: true, providerMessageId };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Sends (or records) one SMS and logs it to SmsMessage. Never throws: SMS is a
 * side-channel and must not break the booking/payment flow that triggered it.
 */
export async function sendSms(input: SendSmsInput) {
  const config = smsConfig();
  const to = normalizeZambianPhone(input.to);
  const message = toGsmSafe(input.message).trim();
  const base = {
    to: to ?? String(input.to ?? ""),
    body: message,
    purpose: input.purpose,
    driver: config.driver,
    segments: countSegments(message),
    appointmentId: input.appointmentId,
    userId: input.userId,
  };

  try {
    if (!to) {
      return await prisma.smsMessage.create({ data: { ...base, status: "SKIPPED", error: "No valid Zambian mobile number" } });
    }

    if (config.driver === "log") {
      console.info(`[sms:log] → ${to}: ${message}`);
      return await prisma.smsMessage.create({ data: { ...base, status: "SENT", providerMessageId: "log" } });
    }

    // Real sends only past this point: protect the paid credits
    if (config.allowlist.length > 0 && !config.allowlist.includes(to)) {
      return await prisma.smsMessage.create({ data: { ...base, status: "SKIPPED", error: "Number not in SMS_ALLOWLIST" } });
    }

    const sentToday = await prisma.smsMessage.count({
      where: { to, status: { in: ["SENT", "DELIVERED"] }, createdAt: { gte: new Date(Date.now() - 86_400_000) } },
    });
    if (sentToday >= config.dailyLimit) {
      return await prisma.smsMessage.create({ data: { ...base, status: "SKIPPED", error: "Daily per-number limit reached" } });
    }

    const record = await prisma.smsMessage.create({ data: { ...base, status: "QUEUED" } });
    const started = Date.now();
    let result: DriverResult;
    try {
      result = await sendViaHttp(to, message, config.senderId);
    } catch (err) {
      result = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    await recordMetric("SMS", `sms.${input.purpose.toLowerCase()}`, Date.now() - started, result.ok);

    return await prisma.smsMessage.update({
      where: { id: record.id },
      data: result.ok
        ? { status: "SENT", providerMessageId: result.providerMessageId }
        : { status: "FAILED", error: result.error?.slice(0, 500) },
    });
  } catch (err) {
    console.error("SMS send/log failed:", err);
    return null;
  }
}
