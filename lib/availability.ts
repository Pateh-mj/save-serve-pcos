import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@/lib/constants";

const SLOT_DURATION_MINUTES = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Practitioner hours are entered in Zambian time. Africa/Lusaka is UTC+2 with no DST,
// so a fixed offset is exact and keeps slots correct on UTC servers (e.g. Vercel).
const CLINIC_UTC_OFFSET_MS = 2 * 60 * 60 * 1000;

function timeStringToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** UTC instant of 00:00 clinic time on the clinic calendar day of `date` ("YYYY-MM-DD" or a Date). */
function clinicDayStart(date: Date | string) {
  let y: number, m: number, d: number;
  if (typeof date === "string") {
    [y, m, d] = date.split("-").map(Number);
    m -= 1;
  } else {
    const local = new Date(date.getTime() + CLINIC_UTC_OFFSET_MS);
    y = local.getUTCFullYear();
    m = local.getUTCMonth();
    d = local.getUTCDate();
  }
  return new Date(Date.UTC(y, m, d) - CLINIC_UTC_OFFSET_MS);
}

function clinicDayOfWeek(dayStart: Date) {
  return new Date(dayStart.getTime() + CLINIC_UTC_OFFSET_MS).getUTCDay();
}

/** Free 30-minute slots in one day's working hours, skipping booked and past slots. */
function computeSlots(
  dayStart: Date,
  hours: { startTime: string; endTime: string; isActive: boolean } | null | undefined,
  booked: Set<number>
) {
  if (!hours || !hours.isActive) return [];
  const startMinutes = timeStringToMinutes(hours.startTime);
  const endMinutes = timeStringToMinutes(hours.endTime);

  const slots: Date[] = [];
  for (let m = startMinutes; m + SLOT_DURATION_MINUTES <= endMinutes; m += SLOT_DURATION_MINUTES) {
    const slot = new Date(dayStart.getTime() + m * 60000);
    if (booked.has(slot.getTime())) continue;
    if (slot.getTime() < Date.now()) continue; // skip past slots on same-day
    slots.push(slot);
  }
  return slots;
}

async function bookedTimes(practitionerId: string, from: Date, to: Date) {
  const rows = await prisma.appointment.findMany({
    where: {
      practitionerId,
      scheduledAt: { gte: from, lt: to },
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    },
    select: { scheduledAt: true },
  });
  return new Set(rows.map((r) => r.scheduledAt.getTime()));
}

export async function getAvailableSlots(practitionerId: string, date: Date | string) {
  const dayStart = clinicDayStart(date);
  if (isNaN(dayStart.getTime())) return [];

  const hours = await prisma.availability.findUnique({
    where: { practitionerId_dayOfWeek: { practitionerId, dayOfWeek: clinicDayOfWeek(dayStart) } },
  });
  if (!hours || !hours.isActive) return [];

  const booked = await bookedTimes(practitionerId, dayStart, new Date(dayStart.getTime() + DAY_MS));
  return computeSlots(dayStart, hours, booked);
}

/**
 * The next days (starting today, looking `horizonDays` ahead) that still have free slots.
 * Two queries regardless of horizon, so USSD hops stay fast.
 */
export async function getOpenDays(practitionerId: string, horizonDays = 7, maxDays = 4) {
  const firstDay = clinicDayStart(new Date());
  const end = new Date(firstDay.getTime() + horizonDays * DAY_MS);

  const [weekly, booked] = await Promise.all([
    prisma.availability.findMany({ where: { practitionerId } }),
    bookedTimes(practitionerId, firstDay, end),
  ]);

  const days: { dayStart: Date; slots: Date[] }[] = [];
  for (let i = 0; i < horizonDays && days.length < maxDays; i++) {
    const dayStart = new Date(firstDay.getTime() + i * DAY_MS);
    const hours = weekly.find((w) => w.dayOfWeek === clinicDayOfWeek(dayStart));
    const slots = computeSlots(dayStart, hours, booked);
    if (slots.length > 0) days.push({ dayStart, slots });
  }
  return days;
}

export async function isSlotAvailable(practitionerId: string, scheduledAt: Date) {
  if (isNaN(scheduledAt.getTime())) return false;
  const slots = await getAvailableSlots(practitionerId, scheduledAt);
  return slots.some((s) => s.getTime() === scheduledAt.getTime());
}
