import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Delivery-report callback for the HTTP SMS provider. Configure the provider to call
//   https://<host>/api/sms/status?token=<SMS_CALLBACK_TOKEN>
// Accepts query params, form or JSON bodies, using the common field names below.

const ID_FIELDS = ["id", "messageId", "message_id", "msgid", "msgId", "reference"];
const STATUS_FIELDS = ["status", "state", "dlr_status", "deliveryStatus", "dlrStatus"];

function pick(source: Record<string, unknown>, fields: string[]) {
  for (const f of fields) {
    const v = source[f];
    if (v !== undefined && v !== null && String(v) !== "") return String(v);
  }
  return undefined;
}

function mapStatus(raw: string) {
  if (/deliv|success|delivrd/i.test(raw)) return "DELIVERED";
  if (/fail|undeliv|reject|expire|error/i.test(raw)) return "FAILED";
  return null; // intermediate states (queued, sent, buffered) don't change our record
}

async function handle(req: NextRequest) {
  const expected = process.env.SMS_CALLBACK_TOKEN;
  if (!expected || req.nextUrl.searchParams.get("token") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fields: Record<string, unknown> = Object.fromEntries(req.nextUrl.searchParams);
  if (req.method === "POST") {
    const type = req.headers.get("content-type") ?? "";
    if (type.includes("json")) Object.assign(fields, await req.json().catch(() => ({})));
    else Object.assign(fields, Object.fromEntries(await req.formData().catch(() => new FormData())));
  }

  const id = pick(fields, ID_FIELDS);
  const raw = pick(fields, STATUS_FIELDS);
  const status = raw ? mapStatus(raw) : null;
  if (!id || !status) return NextResponse.json({ ok: true, ignored: true });

  const { count } = await prisma.smsMessage.updateMany({
    where: { providerMessageId: id },
    data: { status, error: status === "FAILED" ? `Provider: ${raw}`.slice(0, 500) : null },
  });
  return NextResponse.json({ ok: true, updated: count });
}

export const GET = handle;
export const POST = handle;
