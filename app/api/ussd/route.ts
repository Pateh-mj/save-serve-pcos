import { prisma } from "@/lib/prisma";
import { getAvailableSlots, isSlotAvailable } from "@/lib/availability";
import { calculatePolicyBilling } from "@/lib/policy-guardian";
import { AppointmentStatus } from "@/lib/constants";
import { NextResponse } from "next/server";

async function parseBody(req: Request) {
  const form = await req.formData();
  return {
    phoneNumber: form.get("phoneNumber") as string,
    text: (form.get("text") as string) || "",
  };
}

function respond(text: string, end = false) {
  return new NextResponse(`${end ? "END" : "CON"} ${text}`, {
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(req: Request) {
  const { phoneNumber, text } = await parseBody(req);
  const steps = text.split("*").filter(Boolean);

  const user = await prisma.user.findFirst({
    where: { phone: phoneNumber },
    include: { patient: true },
  });

  // ---- New user onboarding ----
  if (!user) {
    if (steps.length === 0) {
      return respond("Welcome to SaveServe.\nYou are not registered.\n1. Register now");
    }
    if (steps[0] === "1" && steps.length === 1) {
      return respond("Enter your full name:");
    }
    if (steps[0] === "1" && steps.length === 2) {
      const name = steps[1];
      await prisma.user.create({
        data: {
          name,
          phone: phoneNumber,
          email: `${phoneNumber}@ussd.saveserve.local`,
          role: "PATIENT",
          patient: { create: {} }, // tier defaults to "FREE" on User
        },
      });
      return respond(`Registration complete, ${name}. Dial *384# again to book an appointment.`, true);
    }
    return respond("Invalid option.", true);
  }

  const patientId = user.patient?.id;
  if (!patientId) return respond("Account error. Please contact support.", true);

  if (steps.length === 0) {
    return respond(
      "SaveServe Menu:\n1. Book Appointment\n2. My Appointments\n3. Health Records\n4. Billing & Subsidies\n5. Health Tips & Emergency"
    );
  }

  const [menuChoice, ...rest] = steps;

  switch (menuChoice) {
    case "1":
      return handleBooking(rest, patientId);
    case "2":
      return handleMyAppointments(patientId);
    case "3":
      return handleHealthRecords(patientId);
    case "4":
      return handleBilling(patientId);
    case "5":
      return respond(
        "Health Tips: Stay hydrated, attend checkups regularly.\nEmergency: Call 991 (Zambia Ambulance).",
        true
      );
    default:
      return respond("Invalid option.", true);
  }
}

// ---- 1. Book Appointment ----
async function handleBooking(steps: string[], patientId: string) {
  const specialties = await prisma.practitioner.findMany({
    distinct: ["specialty"],
    select: { specialty: true },
  });

  if (steps.length === 0) {
    const menu = specialties.map((s, i) => `${i + 1}. ${s.specialty}`).join("\n");
    return respond(`Select specialty:\n${menu}`);
  }

  const chosenSpecialty = specialties[parseInt(steps[0]) - 1]?.specialty;
  if (!chosenSpecialty) return respond("Invalid selection.", true);

  const practitioners = await prisma.practitioner.findMany({
    where: { specialty: chosenSpecialty },
    include: { user: true },
  });

  if (steps.length === 1) {
    const menu = practitioners.map((p, i) => `${i + 1}. ${p.user.name}`).join("\n");
    return respond(`Select practitioner:\n${menu}`);
  }

  const chosenPractitioner = practitioners[parseInt(steps[1]) - 1];
  if (!chosenPractitioner) return respond("Invalid selection.", true);

  if (steps.length === 2) {
    return respond("Select day:\n1. Today\n2. Tomorrow");
  }

  const dayOffset = steps[2] === "2" ? 1 : 0;
  const selectedDate = new Date(Date.now() + dayOffset * 86400000);

  const slots = await getAvailableSlots(chosenPractitioner.id, selectedDate);
  if (slots.length === 0) {
    return respond("No available slots for that day. Please try another day.", true);
  }

  if (steps.length === 3) {
    const menu = slots
      .map((s, i) => `${i + 1}. ${s.toLocaleTimeString("en-ZM", { hour: "2-digit", minute: "2-digit" })}`)
      .join("\n");
    return respond(`Select time:\n${menu}`);
  }

  const chosenSlot = slots[parseInt(steps[3]) - 1];
  if (!chosenSlot) return respond("Invalid selection.", true);

  if (steps.length === 4) {
    return respond(
      `Confirm booking with ${chosenPractitioner.user.name} at ${chosenSlot.toLocaleTimeString("en-ZM", {
        hour: "2-digit",
        minute: "2-digit",
      })}?\n1. Confirm\n2. Cancel`
    );
  }

  if (steps[4] !== "1") return respond("Booking cancelled.", true);

  const stillAvailable = await isSlotAvailable(chosenPractitioner.id, chosenSlot);
  if (!stillAvailable) {
    return respond("Sorry, that slot was just taken. Please start again.", true);
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      practitionerId: chosenPractitioner.id,
      scheduledAt: chosenSlot,
      status: AppointmentStatus.PENDING,
      channel: "USSD",
    },
  });

  const billingResult = await calculatePolicyBilling({
    patientId,
    practitionerId: chosenPractitioner.id,
  });

  await prisma.billing.create({
    data: {
      appointmentId: appointment.id,
      patientId,
      amount: billingResult.baseAmount,
      discountedAmount: billingResult.discountedAmount,
      tier: billingResult.tier,
      subsidyApplied: billingResult.subsidyApplied,
      subsidyAmount: billingResult.subsidyAmount,
      status: billingResult.status,
      policyId: billingResult.policyId,
    },
  });

  return respond("Appointment booked successfully. You will receive a confirmation shortly.", true);
}

// ---- 2. My Appointments ----
async function handleMyAppointments(patientId: string) {
  const appointments = await prisma.appointment.findMany({
    where: { patientId, status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] } },
    orderBy: { scheduledAt: "asc" },
    include: { practitioner: { include: { user: true } } },
    take: 5,
  });

  if (appointments.length === 0) return respond("You have no upcoming appointments.", true);

  const list = appointments
    .map(
      (a) =>
        `${a.practitioner.user.name} - ${new Date(a.scheduledAt).toLocaleDateString("en-ZM", {
          month: "short",
          day: "numeric",
        })} (${a.status})`
    )
    .join("\n");

  return respond(`Your appointments:\n${list}`, true);
}

// ---- 3. Health Records ----
async function handleHealthRecords(patientId: string) {
  const records = await prisma.eHRRecord.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  if (records.length === 0) return respond("No health records found.", true);

  const list = records.map((r) => `Diagnosis: ${r.diagnosis ?? "N/A"}`).join("\n");
  return respond(list, true);
}

// ---- 4. Billing & Subsidies ----
async function handleBilling(patientId: string) {
  const billing = await prisma.billing.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  if (billing.length === 0) return respond("No billing records found.", true);

  const list = billing
    .map((b) => `Amount: ZMW ${b.amount} (Subsidy: ZMW ${b.subsidyAmount ?? 0})`)
    .join("\n");

  return respond(list, true);
}