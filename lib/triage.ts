// Symptom-based triage (report §1.5). A simplified rule set modelled on WHO ETAT
// "danger signs": any danger sign → EMERGENCY; otherwise a weighted score of
// symptoms, severity and duration decides URGENT vs ROUTINE.
// It prioritises the practitioner queue; it is not a diagnosis and not clinically validated.
// Client-safe: no server-only imports.

export const TriageLevel = {
  EMERGENCY: "EMERGENCY",
  URGENT: "URGENT",
  ROUTINE: "ROUTINE",
} as const;
export type TriageLevel = (typeof TriageLevel)[keyof typeof TriageLevel];

/** Lower sorts first in the practitioner queue. */
export const TRIAGE_PRIORITY: Record<string, number> = {
  [TriageLevel.EMERGENCY]: 0,
  [TriageLevel.URGENT]: 1,
  [TriageLevel.ROUTINE]: 2,
};

type Symptom = { label: string; weight: number; dangerSign?: boolean };

export const SYMPTOMS = {
  FEVER: { label: "Fever", weight: 2 },
  COUGH: { label: "Cough or cold", weight: 1 },
  HEADACHE: { label: "Headache", weight: 1 },
  STOMACH: { label: "Diarrhoea or vomiting", weight: 2 },
  PAIN: { label: "Body or joint pain", weight: 1 },
  RASH: { label: "Rash or skin problem", weight: 1 },
  PREGNANCY: { label: "Pregnancy concern", weight: 3 },
  INJURY: { label: "Injury or wound", weight: 2 },
  MEDICATION: { label: "Medication refill or advice", weight: 0 },
  // Danger signs
  CHEST_PAIN: { label: "Chest pain", weight: 0, dangerSign: true },
  BREATHING: { label: "Difficulty breathing", weight: 0, dangerSign: true },
  BLEEDING: { label: "Heavy bleeding", weight: 0, dangerSign: true },
  UNCONSCIOUS: { label: "Fainting or confusion", weight: 0, dangerSign: true },
  CONVULSIONS: { label: "Convulsions (fits)", weight: 0, dangerSign: true },
  DANGER_SIGN: { label: "Danger sign reported", weight: 0, dangerSign: true }, // USSD yes/no answer
} satisfies Record<string, Symptom>;

export type SymptomCode = keyof typeof SYMPTOMS;

export const SYMPTOM_CODES = Object.keys(SYMPTOMS) as SymptomCode[];
export const ROUTINE_SYMPTOM_CODES = SYMPTOM_CODES.filter((c) => !(SYMPTOMS[c] as Symptom).dangerSign);
// The generic USSD flag is not offered as a web checkbox
export const DANGER_SIGN_CODES = SYMPTOM_CODES.filter((c) => (SYMPTOMS[c] as Symptom).dangerSign && c !== "DANGER_SIGN");

export interface TriageInput {
  symptoms: string[];
  /** Days unwell. */
  durationDays?: number;
  /** 1 mild · 2 moderate · 3 severe */
  severity?: number;
}

export interface TriageResult {
  level: TriageLevel;
  score: number;
  symptoms: SymptomCode[];
  dangerSigns: SymptomCode[];
  advice: string;
}

export const EMERGENCY_ADVICE =
  "Danger signs reported. Call 991 or go to the nearest health facility now. Your visit is flagged as an emergency.";

export function assessTriage(input: TriageInput): TriageResult {
  const symptoms = [...new Set(input.symptoms)].filter((s): s is SymptomCode => s in SYMPTOMS);
  const dangerSigns = symptoms.filter((s) => (SYMPTOMS[s] as Symptom).dangerSign);

  const severity = Math.min(3, Math.max(1, input.severity ?? 1));
  const days = Math.max(0, input.durationDays ?? 0);
  const score =
    symptoms.reduce((sum, s) => sum + SYMPTOMS[s].weight, 0) +
    (severity - 1) * 2 +
    (days >= 7 ? 2 : days >= 3 ? 1 : 0);

  if (dangerSigns.length > 0) {
    return { level: TriageLevel.EMERGENCY, score: Math.max(score, 10), symptoms, dangerSigns, advice: EMERGENCY_ADVICE };
  }
  if (score >= 5) {
    return {
      level: TriageLevel.URGENT,
      score,
      symptoms,
      dangerSigns,
      advice: "Your symptoms need attention soon. Choose the earliest slot available.",
    };
  }
  return {
    level: TriageLevel.ROUTINE,
    score,
    symptoms,
    dangerSigns,
    advice: "Routine visit. Any convenient slot is fine.",
  };
}

export function symptomLabels(codes: string) {
  return codes
    .split(",")
    .filter(Boolean)
    .map((c) => (c in SYMPTOMS ? SYMPTOMS[c as SymptomCode].label : c));
}
