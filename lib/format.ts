// Date/time formatting pinned to the clinic timezone so output is the same on a
// UTC server (e.g. Vercel), a developer laptop, and the patient's browser.
// Client-safe: no server-only imports.

export const CLINIC_TIME_ZONE = "Africa/Lusaka";
const LOCALE = "en-ZM";

type DateInput = Date | string | number;

/** e.g. "20 Oct 2026" */
export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
) {
  return new Date(value).toLocaleDateString(LOCALE, { ...options, timeZone: CLINIC_TIME_ZONE });
}

/** e.g. "14:30" */
export function formatTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
) {
  return new Date(value).toLocaleTimeString(LOCALE, { ...options, timeZone: CLINIC_TIME_ZONE });
}

/** e.g. "Tue, 20 Oct, 14:30" */
export function formatDateTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }
) {
  return new Date(value).toLocaleString(LOCALE, { ...options, timeZone: CLINIC_TIME_ZONE });
}

/** Clinic calendar day as "YYYY-MM-DD" — use for "same day" comparisons and grouping. */
export function clinicDateKey(value: DateInput = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(value));
}

/** Hour of day (0–23) in clinic time. */
export function clinicHour(value: DateInput = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC_TIME_ZONE, hour: "2-digit", hourCycle: "h23" }).format(
      new Date(value)
    )
  );
}
