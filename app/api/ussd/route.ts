import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, Channel, AppointmentStatus } from "@/lib/constants";
import { calculatePolicyBilling } from "@/lib/policy-guardian";

export async function POST(req: NextRequest) {
  try {
    let sessionId = "";
    let serviceCode = "";
    let phoneNumber = "";
    let text = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      sessionId = (formData.get("sessionId") as string) || "";
      serviceCode = (formData.get("serviceCode") as string) || "";
      phoneNumber = (formData.get("phoneNumber") as string) || "";
      text = (formData.get("text") as string) || "";
    } else {
      const body = await req.json().catch(() => ({}));
      sessionId = body.sessionId || "";
      serviceCode = body.serviceCode || "";
      phoneNumber = body.phoneNumber || "";
      text = body.text || "";
    }

    phoneNumber = phoneNumber.trim();
    const responseText = await processUssdRequest({
      sessionId,
      serviceCode,
      phoneNumber,
      text: text.trim(),
    });

    return new NextResponse(responseText, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("USSD Error:", error);
    return new NextResponse("END System error. Please try again later.", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phoneNumber = searchParams.get("phoneNumber") || "+260971000001";
  const text = searchParams.get("text") || "";
  const sessionId = searchParams.get("sessionId") || `USSD-SIM-${Date.now()}`;

  const responseText = await processUssdRequest({
    sessionId,
    serviceCode: "*384#",
    phoneNumber,
    text,
  });

  return new NextResponse(responseText, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

interface UssdContext {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
}

async function processUssdRequest({ phoneNumber, text }: UssdContext): Promise<string> {
  // Normalize phone number for DB lookup
  let patient = await prisma.patient.findFirst({
    where: {
      user: {
        OR: [
          { phone: phoneNumber },
          { phone: phoneNumber.replace("+", "") },
          { phone: `+${phoneNumber.replace("+", "")}` },
        ],
      },
    },
    include: { user: true },
  });

  const parts = text ? text.split("*") : [];

  // ==========================================
  // UNREGISTERED USER ONBOARDING
  // ==========================================
  if (!patient) {
    if (parts.length === 0 || text === "") {
      return (
        "CON Welcome to SaveServe (PCOS)\n" +
        "You are not registered on this phone number.\n\n" +
        "1. Quick Register (Free Tier)\n" +
        "2. Exit"
      );
    }

    if (parts[0] === "2") {
      return "END Thank you for calling SaveServe. Stay safe!";
    }

    if (parts[0] === "1" && parts.length === 1) {
      return "CON Enter your Full Name:\n(e.g. Chanda Mwila)";
    }

    if (parts[0] === "1" && parts.length === 2) {
      const name = parts[1].trim();
      const generatedEmail = `ussd_${phoneNumber.replace(/\D/g, "") || Date.now()}@saveserve.org`;

      const newUser = await prisma.user.create({
        data: {
          name,
          phone: phoneNumber || `+260${Date.now().toString().slice(-9)}`,
          email: generatedEmail,
          role: Role.PATIENT,
          tier: "FREE",
          patient: { create: {} },
        },
        include: { patient: true },
      });

      return (
        `CON Welcome ${name}!\n` +
        "Registration successful on FREE Health Equity Tier.\n\n" +
        "1. Proceed to Main Menu\n" +
        "2. Exit"
      );
    }

    if (parts[0] === "1" && parts.length >= 3 && parts[2] === "1") {
      // Refresh patient record and proceed to main menu simulation
      patient = await prisma.patient.findFirst({
        where: { user: { phone: phoneNumber } },
        include: { user: true },
      });
      // Fall through to show main menu
      return showMainMenu(patient?.user.name ?? "Patient");
    }

    return "END Registration cancelled. Dial *384# to retry.";
  }

  // ==========================================
  // REGISTERED USER MAIN FLOW
  // ==========================================
  if (parts.length === 0 || text === "") {
    return showMainMenu(patient.user.name ?? "Patient");
  }

  const rootChoice = parts[0];

  // ------------------------------------------
  // 1. BOOK APPOINTMENT
  // ------------------------------------------
  if (rootChoice === "1") {
    // Step 1: Select Specialty
    if (parts.length === 1) {
      return (
        "CON SELECT MEDICAL SERVICE:\n" +
        "1. Community Nurse\n" +
        "2. Pharmacist Consultation\n" +
        "3. Physiotherapy\n" +
        "0. Back to Main Menu"
      );
    }

    if (parts[1] === "0") {
      return showMainMenu(patient.user.name ?? "Patient");
    }

    const specialtyMap: Record<string, string> = {
      "1": "NURSE",
      "2": "PHARMACIST",
      "3": "PHYSIOTHERAPIST",
    };
    const specialty = specialtyMap[parts[1]] || "NURSE";

    const practitioners = await prisma.practitioner.findMany({
      where: { specialty },
      include: { user: true },
      take: 4,
    });

    // Step 2: Select Practitioner
    if (parts.length === 2) {
      if (practitioners.length === 0) {
        return "END No practitioners currently on duty for this specialty. Please try another service.";
      }

      let menu = `CON SELECT ${specialty}:\n`;
      practitioners.forEach((p, idx) => {
        menu += `${idx + 1}. ${p.user.name ?? "Practitioner"} (${p.location ?? "Lusaka"})\n`;
      });
      menu += "0. Back";
      return menu;
    }

    if (parts[2] === "0") {
      return (
        "CON SELECT MEDICAL SERVICE:\n" +
        "1. Community Nurse\n" +
        "2. Pharmacist Consultation\n" +
        "3. Physiotherapy"
      );
    }

    const pIndex = parseInt(parts[2], 10) - 1;
    const selectedPractitioner = practitioners[pIndex] || practitioners[0];
    if (!selectedPractitioner) {
      return "END Invalid practitioner selected. Dial *384# to restart.";
    }

    // Step 3: Select Schedule Time
    if (parts.length === 3) {
      return (
        `CON SELECT TIME SLOT:\n` +
        `With: ${selectedPractitioner.user.name}\n\n` +
        `1. Today (09:00 - 11:00 AM)\n` +
        `2. Today (02:00 - 04:00 PM)\n` +
        `3. Tomorrow (09:00 - 11:00 AM)\n` +
        `4. Tomorrow (02:00 - 04:00 PM)`
      );
    }

    const timeSlotMap: Record<string, string> = {
      "1": "Today 10:00 AM",
      "2": "Today 02:30 PM",
      "3": "Tomorrow 10:00 AM",
      "4": "Tomorrow 02:30 PM",
    };
    const selectedTime = timeSlotMap[parts[3]] || "Today 10:00 AM";

    // Step 4: Policy Guardian Subsidy Calculation & Preview
    if (parts.length === 4) {
      const policyCalc = await calculatePolicyBilling({
        patientId: patient.id,
        practitionerId: selectedPractitioner.id,
        tier: patient.user.tier,
      });

      const subsidyText = policyCalc.subsidyApplied
        ? `Subsidy: 100% NGO Spon.\nPayable: ZMW 0.00`
        : `Payable: ZMW ${policyCalc.finalAmount.toFixed(2)}`;

      return (
        `CON CONFIRM BOOKING:\n` +
        `Dr: ${selectedPractitioner.user.name}\n` +
        `Time: ${selectedTime}\n` +
        `Tier: ${patient.user.tier}\n` +
        `${subsidyText}\n\n` +
        `1. Confirm & Sync to Cloud EHR\n` +
        `2. Cancel`
      );
    }

    // Step 5: Final Submission / Offline-Sync Stub creation
    if (parts.length === 5) {
      if (parts[4] === "1") {
        const policyCalc = await calculatePolicyBilling({
          patientId: patient.id,
          practitionerId: selectedPractitioner.id,
          tier: patient.user.tier,
        });

        // Set appointment date based on slot selection
        const apptDate = new Date();
        if (parts[3] === "3" || parts[3] === "4") {
          apptDate.setDate(apptDate.getDate() + 1);
        }
        apptDate.setHours(parts[3] === "2" || parts[3] === "4" ? 14 : 10, 0, 0, 0);

        await prisma.appointment.create({
          data: {
            patientId: patient.id,
            practitionerId: selectedPractitioner.id,
            scheduledAt: apptDate,
            status: AppointmentStatus.PENDING,
            channel: Channel.USSD,
            notes: `Booked via USSD *384# [Slot: ${selectedTime}]`,
            billing: {
              create: {
                patientId: patient.id,
                amount: policyCalc.baseAmount,
                discountedAmount: policyCalc.finalAmount,
                tier: policyCalc.tier,
                subsidyApplied: policyCalc.subsidyApplied,
                subsidyAmount: policyCalc.subsidyAmount > 0 ? policyCalc.subsidyAmount : null,
                status: policyCalc.status,
                policyId: policyCalc.policyId,
              },
            },
          },
        });

        return (
          `END SUCCESS! Appointment booked.\n\n` +
          `Officer: ${selectedPractitioner.user.name}\n` +
          `Time: ${selectedTime}\n` +
          `Status: PENDING CONFIRMATION\n` +
          `Expect SMS confirmation on ${phoneNumber}.`
        );
      } else {
        return "END Booking cancelled. Dial *384# anytime to access SaveServe.";
      }
    }
  }

  // ------------------------------------------
  // 2. MY APPOINTMENTS
  // ------------------------------------------
  if (rootChoice === "2") {
    const latestAppt = await prisma.appointment.findFirst({
      where: { patientId: patient.id },
      include: { practitioner: { include: { user: true } } },
      orderBy: { scheduledAt: "desc" },
    });

    if (!latestAppt) {
      return "END You have no active appointments.\nDial *384# and press 1 to book a consultation.";
    }

    const dateStr = new Date(latestAppt.scheduledAt).toLocaleDateString("en-ZM", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      `END APPOINTMENT STATUS:\n\n` +
      `Officer: ${latestAppt.practitioner.user.name}\n` +
      `Status: ${latestAppt.status}\n` +
      `Scheduled: ${dateStr}\n` +
      `Channel: ${latestAppt.channel}\n` +
      `Stay tuned for medical officer call.`
    );
  }

  // ------------------------------------------
  // 3. HEALTH RECORDS (EHR)
  // ------------------------------------------
  if (rootChoice === "3") {
    const latestEhr = await prisma.eHRRecord.findFirst({
      where: { patientId: patient.id },
      include: { practitioner: { include: { user: true } } },
      orderBy: { visitDate: "desc" },
    });

    if (!latestEhr) {
      return "END No clinical EHR records found.\nRecords will appear here after your doctor consultation.";
    }

    return (
      `END LATEST EHR RECORD:\n\n` +
      `Practitioner: ${latestEhr.practitioner.user.name}\n` +
      `Diagnosis: ${latestEhr.diagnosis || "Consultation complete"}\n` +
      `Prescription: ${latestEhr.prescription || "None recorded"}\n` +
      `Date: ${new Date(latestEhr.visitDate).toLocaleDateString("en-ZM")}`
    );
  }

  // ------------------------------------------
  // 4. BILLING & SUBSIDIES
  // ------------------------------------------
  if (rootChoice === "4") {
    const billings = await prisma.billing.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    });

    const totalSubsidized = billings
      .filter((b) => b.subsidyApplied)
      .reduce((sum, b) => sum + (b.subsidyAmount ?? b.amount), 0);

    const pendingAmount = billings
      .filter((b) => b.status === "PENDING")
      .reduce((sum, b) => sum + (b.discountedAmount ?? b.amount), 0);

    return (
      `END BILLING & EQUITY SUMMARY:\n\n` +
      `Tier: ${patient.user.tier} TIER\n` +
      `Total NGO Subsidies: ZMW ${totalSubsidized.toFixed(2)}\n` +
      `Outstanding Balance: ZMW ${pendingAmount.toFixed(2)}\n` +
      `Protected by Policy Guardian.`
    );
  }

  // ------------------------------------------
  // 5. HEALTH TIPS & SUPPORT
  // ------------------------------------------
  if (rootChoice === "5") {
    return (
      "END SAVESERVE HEALTH SUPPORT:\n\n" +
      "1. Malaria prevention: Sleep under treated net.\n" +
      "2. Emergency line: 992 (Zambia Toll-Free)\n" +
      "3. Web portal: saveserve.org\n" +
      "PCOS — Healthcare for Everyone."
    );
  }

  return "END Invalid option selected. Please dial *384# again.";
}

function showMainMenu(userName: string): string {
  const firstName = userName.split(" ")[0] || "there";
  return (
    `CON Welcome to SaveServe, ${firstName}!\n` +
    "Select an option:\n\n" +
    "1. Book Appointment\n" +
    "2. My Appointments\n" +
    "3. Health Records (EHR)\n" +
    "4. My Billing & Subsidies\n" +
    "5. Health Tips & Support"
  );
}
