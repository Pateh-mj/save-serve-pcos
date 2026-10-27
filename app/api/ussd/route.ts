import { NextResponse } from "next/server";
import { handleUssd, type UssdReply } from "@/lib/ussd";
import { normalizeZambianPhone } from "@/lib/phone";
import { recordMetric } from "@/lib/metrics";
import { notifyLater } from "@/lib/notifications";

// Africa's Talking posts form-urlencoded (sessionId, serviceCode, phoneNumber, networkCode, text);
// the in-app simulator posts the same fields as JSON. Replies are plain text: "CON …" or "END …".

async function parseBody(req: Request) {
  if (req.headers.get("content-type")?.includes("application/json")) {
    const body = await req.json();
    return {
      sessionId: body.sessionId ? String(body.sessionId) : undefined,
      phoneNumber: String(body.phoneNumber ?? ""),
      text: String(body.text ?? ""),
    };
  }
  const form = await req.formData();
  return {
    sessionId: (form.get("sessionId") as string) || undefined,
    phoneNumber: (form.get("phoneNumber") as string) ?? "",
    text: (form.get("text") as string) || "",
  };
}

function respond(reply: Pick<UssdReply, "text" | "end">) {
  return new NextResponse(`${reply.end ? "END" : "CON"} ${reply.text}`, {
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(req: Request) {
  const started = Date.now();
  let reply: UssdReply;
  let ok = true;

  try {
    const { sessionId, phoneNumber, text } = await parseBody(req);
    const phone = normalizeZambianPhone(phoneNumber);
    if (!phone) return respond({ text: "This service is available to Zambian mobile numbers only.", end: true });

    reply = await handleUssd({ sessionId, phone, text });
  } catch (err) {
    console.error("USSD error:", err);
    ok = false;
    reply = { text: "Service temporarily unavailable. Please try again shortly.", end: true, action: "ussd.error" };
  }

  // Response time per hop — evaluation metric (report objective 4)
  notifyLater(() => recordMetric("USSD", reply.action, Date.now() - started, ok));
  return respond(reply);
}
