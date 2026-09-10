import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@/lib/constants";

const SLOT_DURATION_MINUTES = 30;

function timeStringToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function getAvailableSlots(practitionerId: string, date: Date) {
  const dayOfWeek = date.getDay();

  const availability = await prisma.availability.findUnique({
    where: { practitionerId_dayOfWeek: { practitionerId, dayOfWeek } },
  });

  if (!availability || !availability.isActive) return [];

  const startMinutes = timeStringToMinutes(availability.startTime);
  const endMinutes = timeStringToMinutes(availability.endTime);

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      practitionerId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    },
    select: { scheduledAt: true },
  });

  const bookedMinutes = new Set(
    bookedAppointments.map((a) => {
      const d = new Date(a.scheduledAt);
      return d.getHours() * 60 + d.getMinutes();
    })
  );

  const slots: Date[] = [];
  for (let m = startMinutes; m + SLOT_DURATION_MINUTES <= endMinutes; m += SLOT_DURATION_MINUTES) {
    if (bookedMinutes.has(m)) continue;
    const slot = new Date(date);
    slot.setHours(Math.floor(m / 60), m % 60, 0, 0);
    if (slot.getTime() < Date.now()) continue; // skip past slots on same-day
    slots.push(slot);
  }

  return slots;
}

export async function isSlotAvailable(practitionerId: string, scheduledAt: Date) {
  const slots = await getAvailableSlots(practitionerId, scheduledAt);
  return slots.some((s) => s.getTime() === new Date(scheduledAt).getTime());
}