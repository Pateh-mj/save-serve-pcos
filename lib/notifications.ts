import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus, BillingStatus } from "@/lib/constants";
import { appointmentRef } from "@/lib/booking";
import { formatDate, formatTime } from "@/lib/format";
import { sendSms } from "@/lib/sms";
import { TriageLevel, symptomLabels } from "@/lib/triage";

// Templates stay plain ASCII and under ~160 characters: one SMS credit each.

/**
 * Runs a notification after the HTTP response is sent, so a slow SMS provider
 * never delays a booking or a USSD screen. Must be called inside a request.
 */
export function notifyLater(task: () => Promise<unknown>) {
  after(async () => {
    try {
      await task();
    } catch (err) {
      console.error("Notification failed:", err);
    }
  });
}

function when(d: Date) {
  return `${formatDate(d, { weekday: "short", day: "numeric", month: "short" })} at ${formatTime(d)}`;
}

function feeText(billing: { status: string; discountedAmount: number | null; amount: number } | null) {
  if (!billing) return "";
  if (billing.status === BillingStatus.SUBSIDIZED) return "Fee ZMW 0 (NGO subsidised)";
  if (billing.status === BillingStatus.WAIVED) return "Fee waived";
  return `Fee ZMW ${(billing.discountedAmount ?? billing.amount).toFixed(2)}`;
}

function loadAppointment(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      billing: true,
      ehrRecord: true,
      patient: { include: { user: true } },
      practitioner: { include: { user: true } },
    },
  });
}

export async function notifyWelcome(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await sendSms({
    to: user.phone,
    userId,
    purpose: "WELCOME",
    message: `Welcome to SaveServe, ${user.name ?? "patient"}. Dial *384# any time to book visits, see your records and pay bills.`,
  });
}

export async function notifyBooked(appointmentId: string) {
  const a = await loadAppointment(appointmentId);
  if (!a) return;
  const ref = appointmentRef(a.id);

  await sendSms({
    to: a.patient.user.phone,
    userId: a.patient.userId,
    appointmentId: a.id,
    purpose: "BOOKED",
    message: `SaveServe: Booked with ${a.practitioner.user.name} ${when(a.scheduledAt)}. ${feeText(a.billing)}. Ref ${ref}. Awaiting confirmation.`,
  });

  // Urgent/emergency triage: alert the practitioner straight away
  if (a.triageLevel !== TriageLevel.ROUTINE) {
    const symptoms = symptomLabels(a.symptoms).join(", ").slice(0, 45);
    await sendSms({
      to: a.practitioner.user.phone,
      userId: a.practitioner.userId,
      appointmentId: a.id,
      purpose: "PRACTITIONER_ALERT",
      message: `SaveServe ${a.triageLevel}: ${a.patient.user.name} booked ${when(a.scheduledAt)}. ${symptoms ? `Symptoms: ${symptoms}. ` : ""}Ref ${ref}. See dashboard.`,
    });
  }
}

export async function notifyStatusChange(appointmentId: string) {
  const a = await loadAppointment(appointmentId);
  if (!a) return;
  const ref = appointmentRef(a.id);

  if (a.status === AppointmentStatus.CONFIRMED) {
    await sendSms({
      to: a.patient.user.phone,
      userId: a.patient.userId,
      appointmentId: a.id,
      purpose: "CONFIRMED",
      message: `SaveServe: Your visit with ${a.practitioner.user.name} ${when(a.scheduledAt)} is CONFIRMED. Ref ${ref}. Dial *384# to manage it.`,
    });
  } else if (a.status === AppointmentStatus.CANCELLED) {
    await sendSms({
      to: a.patient.user.phone,
      userId: a.patient.userId,
      appointmentId: a.id,
      purpose: "CANCELLED",
      message: `SaveServe: Your visit with ${a.practitioner.user.name} ${when(a.scheduledAt)} was cancelled. Any unpaid fee is waived. Dial *384# to rebook.`,
    });
  } else if (a.status === AppointmentStatus.COMPLETED) {
    const followUp = a.ehrRecord?.followUpDate
      ? ` Follow-up due ${formatDate(a.ehrRecord.followUpDate, { day: "numeric", month: "short" })}.`
      : "";
    await sendSms({
      to: a.patient.user.phone,
      userId: a.patient.userId,
      appointmentId: a.id,
      purpose: "COMPLETED",
      message: `SaveServe: Visit with ${a.practitioner.user.name} completed. Your record is updated - dial *384# option 3.${followUp} Please rate your visit: option 5.`,
    });
  }
}

export async function notifyPayment(billingId: string) {
  const b = await prisma.billing.findUnique({
    where: { id: billingId },
    include: { patient: { include: { user: true } } },
  });
  if (!b || b.status !== BillingStatus.PAID) return;
  await sendSms({
    to: b.patient.user.phone,
    userId: b.patient.userId,
    appointmentId: b.appointmentId,
    purpose: "PAYMENT",
    message: `SaveServe: Payment of ZMW ${(b.discountedAmount ?? b.amount).toFixed(2)} received for visit ${appointmentRef(b.appointmentId)}. Thank you.`,
  });
}

/**
 * Reminder job (daily cron + admin button): visits in the next 24h and follow-ups
 * due in the next 48h, each reminded once.
 */
export async function runReminderJob() {
  const now = Date.now();
  const due = await prisma.appointment.findMany({
    where: {
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      scheduledAt: { gte: new Date(now + 30 * 60_000), lte: new Date(now + 24 * 3_600_000) },
      reminderSentAt: null,
    },
    include: { patient: { include: { user: true } }, practitioner: { include: { user: true } } },
  });

  let reminders = 0;
  for (const a of due) {
    // Claim first so overlapping runs can't double-send
    const { count } = await prisma.appointment.updateMany({
      where: { id: a.id, reminderSentAt: null },
      data: { reminderSentAt: new Date() },
    });
    if (count === 0) continue;
    await sendSms({
      to: a.patient.user.phone,
      userId: a.patient.userId,
      appointmentId: a.id,
      purpose: "REMINDER",
      message: `SaveServe reminder: visit with ${a.practitioner.user.name} ${when(a.scheduledAt)}. Ref ${appointmentRef(a.id)}. Dial *384# option 2 to cancel.`,
    });
    reminders++;
  }

  const followUps = await prisma.eHRRecord.findMany({
    where: {
      followUpDate: { gte: new Date(now), lte: new Date(now + 48 * 3_600_000) },
      followUpReminderSentAt: null,
    },
    include: { patient: { include: { user: true } }, practitioner: { include: { user: true } } },
  });

  let followUpReminders = 0;
  for (const r of followUps) {
    const { count } = await prisma.eHRRecord.updateMany({
      where: { id: r.id, followUpReminderSentAt: null },
      data: { followUpReminderSentAt: new Date() },
    });
    if (count === 0 || !r.followUpDate) continue;
    await sendSms({
      to: r.patient.user.phone,
      userId: r.patient.userId,
      purpose: "FOLLOW_UP",
      message: `SaveServe: Your follow-up with ${r.practitioner.user.name} is due ${formatDate(r.followUpDate, { weekday: "short", day: "numeric", month: "short" })}. Dial *384# option 1 to book.`,
    });
    followUpReminders++;
  }

  return { reminders, followUpReminders };
}
