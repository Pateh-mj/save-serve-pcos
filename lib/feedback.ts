import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@/lib/constants";

/** One 1–5 rating per completed appointment, from the patient who attended. */
export async function submitFeedback(input: {
  appointmentId: string;
  patientId: string;
  rating: number;
  comment?: string;
  channel: "WEB" | "USSD";
}) {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false as const, error: "Rating must be a whole number from 1 to 5" };
  }

  const appt = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: { feedback: { select: { id: true } } },
  });
  if (!appt || appt.patientId !== input.patientId) {
    return { ok: false as const, error: "Appointment not found" };
  }
  if (appt.status !== AppointmentStatus.COMPLETED) {
    return { ok: false as const, error: "Only completed visits can be rated" };
  }
  if (appt.feedback) return { ok: false as const, error: "You have already rated this visit" };

  const feedback = await prisma.feedback.create({
    data: {
      appointmentId: appt.id,
      patientId: input.patientId,
      rating: input.rating,
      comment: input.comment?.slice(0, 500),
      channel: input.channel,
    },
  });
  return { ok: true as const, feedback };
}
