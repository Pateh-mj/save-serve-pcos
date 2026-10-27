// Zambian mobile numbers: +260 followed by 9 digits starting 7 or 9
// (MTN 096/076, Airtel 097/077, Zamtel 095/075).

/** Any common Zambian format ("0971234567", "260971234567", "+260 97 123 4567") → "+260971234567", or null. */
export function normalizeZambianPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let d = input.replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("0")) d = "260" + d.slice(1);
  if (d.length === 9 && /^[79]/.test(d)) d = "260" + d;
  return /^260[79]\d{8}$/.test(d) ? `+${d}` : null;
}

/** Format an E.164 Zambian number the way an SMS provider expects it. */
export function formatPhoneFor(e164: string, format: "e164" | "intl" | "local") {
  const digits = e164.replace(/^\+/, "");
  if (format === "intl") return digits; // 260971234567
  if (format === "local") return "0" + digits.slice(3); // 0971234567
  return e164; // +260971234567
}
