import { prisma } from "@/lib/prisma";
import { AppointmentStatus, BillingStatus, Channel, Role } from "@/lib/constants";
import { getOpenDays } from "@/lib/availability";
import { appointmentRef, bookAppointment } from "@/lib/booking";
import { calculatePolicyBilling } from "@/lib/policy-guardian";
import { transitionAppointment } from "@/lib/appointments";
import { payBilling } from "@/lib/billing";
import { submitFeedback } from "@/lib/feedback";
import { assessTriage, EMERGENCY_ADVICE, TriageLevel, type SymptomCode } from "@/lib/triage";
import { formatDate, formatTime } from "@/lib/format";
import {
  notifyBooked,
  notifyLater,
  notifyPayment,
  notifyStatusChange,
  notifyWelcome,
} from "@/lib/notifications";

/**
 * USSD menu engine (Africa's Talking protocol). `text` accumulates the whole session
 * path ("1*2*3"), so each request re-walks the path with a step consumer. The only
 * state kept is a USSDSession row, used to resume a booking after a dropped session
 * (report §1.9: session timeout handling).
 */

export interface UssdReply {
  text: string;
  end: boolean;
  /** Metric label, e.g. "ussd.book" */
  action: string;
}

const con = (text: string, action: string): UssdReply => ({ text, end: false, action });
const end = (text: string, action: string): UssdReply => ({ text, end: true, action });

const RESUME_WINDOW_MS = 15 * 60_000;
const SESSION_TTL_MS = 3 * 60_000;
const MAX_SCREEN = 182; // USSD screen limit

class Steps {
  private i = 0;
  constructor(private readonly steps: string[]) {}
  next() {
    return this.steps[this.i++];
  }
}

const shortDay = (d: Date) => formatDate(d, { weekday: "short", day: "numeric", month: "short" });
const dayMonth = (d: Date) => formatDate(d, { day: "numeric", month: "short" });

// ─── Entry point ─────────────────────────────────────────────────────────────

export async function handleUssd(input: { sessionId?: string; phone: string; text: string }): Promise<UssdReply> {
  const rawSteps = input.text.split("*").filter((s) => s !== "");

  // Independent lookups in parallel: every round-trip counts against the gateway timeout
  const [session, user] = await Promise.all([
    input.sessionId ? prisma.uSSDSession.findUnique({ where: { sessionId: input.sessionId } }) : null,
    prisma.user.findFirst({ where: { phone: input.phone }, include: { patient: true } }),
  ]);
  let data: { resumePath?: string } = {};
  try {
    data = session ? JSON.parse(session.data) : {};
  } catch {
    data = {};
  }

  // New session: offer to resume a booking that a dropped session left unfinished
  if (input.sessionId && !session && rawSteps.length === 0) {
    const unfinished = await prisma.uSSDSession.findFirst({
      where: {
        phone: input.phone,
        completed: false,
        state: { startsWith: "1*" },
        lastActivityAt: { gte: new Date(Date.now() - RESUME_WINDOW_MS) },
      },
      orderBy: { lastActivityAt: "desc" },
    });
    if (unfinished && unfinished.state.split("*").length >= 4) {
      data.resumePath = unfinished.state;
      // Offer it once only
      await prisma.uSSDSession.update({ where: { id: unfinished.id }, data: { completed: true } });
    }
  }

  // Translate this session's steps into the effective menu path
  let steps = rawSteps;
  let reply: UssdReply;
  if (data.resumePath && rawSteps.length === 0) {
    reply = con("You have an unfinished booking.\n1. Continue booking\n2. Main menu", "ussd.resume");
  } else if (data.resumePath) {
    const [choice, ...rest] = rawSteps;
    if (choice === "1") steps = [...data.resumePath.split("*"), ...rest];
    else steps = rest;
    reply = await route(user, input.phone, steps);
  } else {
    reply = await route(user, input.phone, steps);
  }

  if (input.sessionId) {
    const sessionId = input.sessionId;
    const state = steps.join("*") || "MAIN_MENU";
    const save = () =>
      prisma.uSSDSession.upsert({
        where: { sessionId },
        create: {
          sessionId,
          phone: input.phone,
          state,
          data: JSON.stringify(data),
          completed: reply.end,
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
        update: {
          state,
          completed: reply.end,
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      });
    // The first hop creates the row (and any resume offer) that the next hop must read, so it
    // is written before replying; later updates run after the reply is sent.
    if (!session) await save();
    else notifyLater(save);
  }

  if (reply.text.length > MAX_SCREEN) {
    console.warn(`USSD screen is ${reply.text.length} chars (limit ${MAX_SCREEN}): ${reply.action}`);
  }
  return reply;
}

type UssdUser = Awaited<ReturnType<typeof prisma.user.findFirst<{ include: { patient: true } }>>>;

async function route(user: UssdUser, phone: string, steps: string[]): Promise<UssdReply> {
  if (!user) return onboarding(phone, new Steps(steps));
  if (!user.patient) return end("This number belongs to a staff account. Please use the web dashboard.", "ussd.staff");

  const s = new Steps(steps);
  const choice = s.next();
  const ctx = { userId: user.id, patientId: user.patient.id, phone };

  switch (choice) {
    case undefined:
      return con(
        `SaveServe *384#\n1. Book a visit\n2. My appointments\n3. Health records\n4. Bills & payment\n5. Rate last visit\n6. Health tips & emergency`,
        "ussd.menu"
      );
    case "1":
      return booking(ctx, s);
    case "2":
      return myAppointments(ctx, s);
    case "3":
      return healthRecords(ctx);
    case "4":
      return bills(ctx, s);
    case "5":
      return rateVisit(ctx, s);
    case "6":
      return end(
        "Health tips: drink clean water, sleep under a treated mosquito net, attend check-ups.\nEMERGENCY: call 991 (ambulance) or go to the nearest clinic.",
        "ussd.tips"
      );
    default:
      return end("Invalid option. Dial *384# to try again.", "ussd.invalid");
  }
}

// ─── Registration ────────────────────────────────────────────────────────────

async function onboarding(phone: string, s: Steps): Promise<UssdReply> {
  const choice = s.next();
  if (choice === undefined) {
    return con("Welcome to SaveServe.\nYou are not registered.\n1. Register\n2. Emergency help", "ussd.register");
  }
  if (choice === "2") return end(EMERGENCY_ADVICE.replace(" Your visit is flagged as an emergency.", ""), "ussd.register");
  if (choice !== "1") return end("Invalid option. Dial *384# to try again.", "ussd.invalid");

  const name = s.next()?.trim();
  if (!name) return con("Enter your full name:", "ussd.register");
  if (name.length < 2 || name.length > 60) return end("Name must be 2-60 characters. Dial *384# to try again.", "ussd.register");

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email: `ussd-${phone.replace(/\D/g, "")}@ussd.saveserve.local`,
      role: Role.PATIENT, // tier defaults to FREE until an administrator classifies the patient
      patient: { create: {} },
    },
  });
  notifyLater(() => notifyWelcome(user.id));
  return end(`Registration complete, ${name}. Dial *384# again to book a visit.`, "ussd.register");
}

// ─── 1. Book a visit (with triage) ───────────────────────────────────────────

const USSD_SYMPTOMS: SymptomCode[] = ["FEVER", "COUGH", "STOMACH", "PAIN", "PREGNANCY", "INJURY", "RASH", "MEDICATION"];
const DURATION_DAYS = [0, 2, 5, 8];

async function booking(ctx: { patientId: string }, s: Steps): Promise<UssdReply> {
  const action = "ussd.book";

  const symptomChoice = s.next();
  if (symptomChoice === undefined) {
    return con(
      "Main problem?\n1. Fever\n2. Cough/cold\n3. Diarrhoea/vomiting\n4. Pain/headache\n5. Pregnancy\n6. Injury/wound\n7. Skin/rash\n8. Medicine/other",
      action
    );
  }
  const symptom = USSD_SYMPTOMS[Number(symptomChoice) - 1];
  if (!symptom) return end("Invalid selection. Dial *384# to try again.", action);

  const danger = s.next();
  if (danger === undefined) {
    return con("Any danger signs? Chest pain, hard breathing, heavy bleeding, fainting or fits\n1. Yes\n2. No", action);
  }
  if (danger !== "1" && danger !== "2") return end("Invalid selection. Dial *384# to try again.", action);

  if (danger === "1") {
    const proceed = s.next();
    if (proceed === undefined) {
      return con("EMERGENCY: Call 991 or go to the nearest clinic NOW.\n1. Also book an urgent visit\n2. Exit", "ussd.emergency");
    }
    if (proceed !== "1") return end("Call 991 or go to the nearest health facility now. Stay safe.", "ussd.emergency");
  }

  const duration = s.next();
  if (duration === undefined) {
    return con("How long have you been unwell?\n1. Today\n2. 1-3 days\n3. 4-7 days\n4. Over a week", action);
  }
  const durationDays = DURATION_DAYS[Number(duration) - 1];
  if (durationDays === undefined) return end("Invalid selection. Dial *384# to try again.", action);

  const triageInput = {
    symptoms: danger === "1" ? [symptom, "DANGER_SIGN"] : [symptom],
    durationDays,
  };

  const specialties = await prisma.practitioner.findMany({
    where: { isVerified: true },
    distinct: ["specialty"],
    select: { specialty: true },
    orderBy: { specialty: "asc" },
  });
  const specialtyChoice = s.next();
  if (specialtyChoice === undefined) {
    if (specialties.length === 0) return end("No practitioners are available right now.", action);
    return con(`Choose a service:\n${specialties.map((sp, i) => `${i + 1}. ${titleCase(sp.specialty)}`).join("\n")}`, action);
  }
  const specialty = specialties[Number(specialtyChoice) - 1]?.specialty;
  if (!specialty) return end("Invalid selection. Dial *384# to try again.", action);

  const practitioners = await prisma.practitioner.findMany({
    where: { specialty, isVerified: true },
    include: { user: true },
    orderBy: { createdAt: "asc" },
    take: 7,
  });
  const practitionerChoice = s.next();
  if (practitionerChoice === undefined) {
    return con(`Choose a practitioner:\n${practitioners.map((p, i) => `${i + 1}. ${p.user.name}`).join("\n")}`, action);
  }
  const practitioner = practitioners[Number(practitionerChoice) - 1];
  if (!practitioner) return end("Invalid selection. Dial *384# to try again.", action);

  const days = await getOpenDays(practitioner.id);
  if (days.length === 0) {
    return end(`${practitioner.user.name} has no free slots in the next 7 days. Dial *384# to choose someone else.`, action);
  }
  const dayChoice = s.next();
  if (dayChoice === undefined) {
    return con(
      `Choose a day:\n${days.map((d, i) => `${i + 1}. ${shortDay(d.dayStart)} (${d.slots.length} free)`).join("\n")}`,
      action
    );
  }
  const day = days[Number(dayChoice) - 1];
  if (!day) return end("Invalid selection. Dial *384# to try again.", action);

  const slots = day.slots.slice(0, 8);
  const timeChoice = s.next();
  if (timeChoice === undefined) {
    return con(`Choose a time:\n${slots.map((t, i) => `${i + 1}. ${formatTime(t)}`).join("\n")}`, action);
  }
  const slot = slots[Number(timeChoice) - 1];
  if (!slot) return end("Invalid selection. Dial *384# to try again.", action);

  const confirm = s.next();
  if (confirm === undefined) {
    // Policy Guardian preview (read-only) so the patient sees fee and priority before confirming
    const [quote, triage] = [
      await calculatePolicyBilling({ patientId: ctx.patientId, practitionerId: practitioner.id }),
      assessTriage(triageInput),
    ];
    const fee =
      quote.status === BillingStatus.SUBSIDIZED
        ? "ZMW 0.00 (100% NGO subsidy)"
        : quote.status === BillingStatus.WAIVED
          ? "ZMW 0.00 (waived)"
          : `ZMW ${quote.finalAmount.toFixed(2)}`;
    return con(
      `Confirm visit:\n${practitioner.user.name}\n${shortDay(slot)} ${formatTime(slot)}\nFee: ${fee}\nPriority: ${triage.level}\n1. Confirm\n2. Cancel`,
      action
    );
  }
  if (confirm !== "1") return end("Booking cancelled. Nothing was charged.", action);

  const result = await bookAppointment({
    patientId: ctx.patientId,
    practitionerId: practitioner.id,
    scheduledAt: slot,
    channel: Channel.USSD,
    triage: triageInput,
  });
  if (!result.ok) return end("Sorry, that slot was just taken. Dial *384# to choose another.", "ussd.book.taken");

  notifyLater(() => notifyBooked(result.appointment.id));
  const emergency = result.triage.level === TriageLevel.EMERGENCY ? " If it gets worse, call 991." : "";
  return end(
    `Booked! Ref ${appointmentRef(result.appointment.id)}. ${practitioner.user.name}, ${shortDay(slot)} ${formatTime(slot)}. An SMS confirmation will follow.${emergency}`,
    "ussd.book.confirmed"
  );
}

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// ─── 2. My appointments (view / cancel) ──────────────────────────────────────

async function myAppointments(ctx: { userId: string; patientId: string }, s: Steps): Promise<UssdReply> {
  const action = "ussd.appointments";
  const upcoming = await prisma.appointment.findMany({
    where: {
      patientId: ctx.patientId,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    include: { practitioner: { include: { user: true } } },
    take: 3, // keeps the list inside one 182-character screen
  });
  if (upcoming.length === 0) return end("You have no upcoming visits. Dial *384# and choose 1 to book.", action);

  const pick = s.next();
  if (pick === undefined) {
    return con(
      `Your visits:\n${upcoming
        .map((a, i) => `${i + 1}. ${dayMonth(a.scheduledAt)} ${formatTime(a.scheduledAt)} ${a.practitioner.user.name}`)
        .join("\n")}\nReply with a number to manage`,
      action
    );
  }
  const appt = upcoming[Number(pick) - 1];
  if (!appt) return end("Invalid selection. Dial *384# to try again.", action);

  const manage = s.next();
  if (manage === undefined) {
    return con(
      `Ref ${appointmentRef(appt.id)}\n${appt.practitioner.user.name}\n${shortDay(appt.scheduledAt)} ${formatTime(appt.scheduledAt)}\nStatus: ${appt.status}\n1. Cancel this visit\n2. Exit`,
      action
    );
  }
  if (manage !== "1") return end("No changes made.", action);

  const sure = s.next();
  if (sure === undefined) return con("Cancel this visit? Any unpaid fee is waived.\n1. Yes, cancel\n2. No", action);
  if (sure !== "1") return end("No changes made.", action);

  const result = await transitionAppointment({
    appointmentId: appt.id,
    to: AppointmentStatus.CANCELLED,
    actor: { role: Role.PATIENT, userId: ctx.userId },
  });
  if (!result.ok) return end(`Could not cancel: ${result.error}`, action);

  notifyLater(() => notifyStatusChange(appt.id));
  return end(`Visit ${appointmentRef(appt.id)} cancelled. Dial *384# to rebook.`, "ussd.appointments.cancelled");
}

// ─── 3. Health records ───────────────────────────────────────────────────────

async function healthRecords(ctx: { patientId: string }): Promise<UssdReply> {
  const records = await prisma.eHRRecord.findMany({
    where: { patientId: ctx.patientId },
    orderBy: { visitDate: "desc" },
    take: 2,
  });
  if (records.length === 0) return end("No health records yet. Records appear after your visit is completed.", "ussd.records");

  const lines = records.map((r) => {
    const rx = r.prescription ? `; Rx: ${r.prescription.slice(0, 40)}` : "";
    const fu = r.followUpDate ? `; follow-up ${formatDate(r.followUpDate, { day: "numeric", month: "short" })}` : "";
    return `${formatDate(r.visitDate, { day: "numeric", month: "short" })}: ${(r.diagnosis ?? "N/A").slice(0, 40)}${rx}${fu}`;
  });
  return end(`Health records:\n${lines.join("\n")}`.slice(0, MAX_SCREEN), "ussd.records");
}

// ─── 4. Bills & payment (simulated mobile money) ─────────────────────────────

const PAY_METHODS = [
  { code: "AIRTEL_MONEY", label: "Airtel Money" },
  { code: "MTN_MOMO", label: "MTN MoMo" },
  { code: "ZAMTEL_KWACHA", label: "Zamtel Kwacha" },
];

async function bills(ctx: { userId: string; patientId: string; phone: string }, s: Steps): Promise<UssdReply> {
  const action = "ussd.bills";
  const [pending, subsidy] = await Promise.all([
    prisma.billing.findMany({
      where: { patientId: ctx.patientId, status: BillingStatus.PENDING },
      include: { appointment: { include: { practitioner: { include: { user: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.billing.aggregate({
      where: { patientId: ctx.patientId, status: BillingStatus.SUBSIDIZED },
      _sum: { subsidyAmount: true },
    }),
  ]);
  const subsidised = (subsidy._sum.subsidyAmount ?? 0).toFixed(2);

  if (pending.length === 0) {
    return end(`You have no unpaid bills.\nNGO subsidies received: ZMW ${subsidised}.`, action);
  }

  const pick = s.next();
  if (pick === undefined) {
    return con(
      `Unpaid bills:\n${pending
        .map((b, i) => `${i + 1}. ZMW ${(b.discountedAmount ?? b.amount).toFixed(2)} (${dayMonth(b.appointment.scheduledAt)})`)
        .join("\n")}\nSubsidies received: ZMW ${subsidised}\nReply with a number to pay`,
      action
    );
  }
  const bill = pending[Number(pick) - 1];
  if (!bill) return end("Invalid selection. Dial *384# to try again.", action);
  const amount = (bill.discountedAmount ?? bill.amount).toFixed(2);

  const methodChoice = s.next();
  if (methodChoice === undefined) {
    return con(`Pay ZMW ${amount} with:\n${PAY_METHODS.map((m, i) => `${i + 1}. ${m.label}`).join("\n")}`, action);
  }
  const method = PAY_METHODS[Number(methodChoice) - 1];
  if (!method) return end("Invalid selection. Dial *384# to try again.", action);

  const confirm = s.next();
  if (confirm === undefined) {
    return con(`Pay ZMW ${amount} from ${ctx.phone} via ${method.label}?\n1. Pay\n2. Cancel`, action);
  }
  if (confirm !== "1") return end("Payment cancelled. Nothing was charged.", action);

  const result = await payBilling({ billingId: bill.id, actor: { role: Role.PATIENT, userId: ctx.userId } });
  if (!result.ok) return end(`Payment failed: ${result.error}`, action);
  if (result.alreadySettled) return end("This bill is already settled.", action);

  notifyLater(() => notifyPayment(bill.id));
  return end(`Payment of ZMW ${amount} received via ${method.label}. An SMS receipt will follow.`, "ussd.bills.paid");
}

// ─── 5. Rate last visit (satisfaction, objective 4) ──────────────────────────

const RATING_LABELS = ["Very poor", "Poor", "Okay", "Good", "Excellent"];

async function rateVisit(ctx: { patientId: string }, s: Steps): Promise<UssdReply> {
  const action = "ussd.rate";
  const visit = await prisma.appointment.findFirst({
    where: { patientId: ctx.patientId, status: AppointmentStatus.COMPLETED, feedback: null },
    orderBy: { scheduledAt: "desc" },
    include: { practitioner: { include: { user: true } } },
  });
  if (!visit) return end("You have no completed visits waiting for a rating. Thank you!", action);

  const rating = s.next();
  if (rating === undefined) {
    return con(
      `Rate your visit with ${visit.practitioner.user.name} on ${shortDay(visit.scheduledAt)}:\n${RATING_LABELS.map((l, i) => `${i + 1}. ${l}`).join("\n")}`,
      action
    );
  }

  const result = await submitFeedback({
    appointmentId: visit.id,
    patientId: ctx.patientId,
    rating: Number(rating),
    channel: "USSD",
  });
  if (!result.ok) return end(result.error, action);
  return end("Thank you for your feedback! It helps us improve care.", "ussd.rate.saved");
}
