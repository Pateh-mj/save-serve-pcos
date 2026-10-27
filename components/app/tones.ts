export type Tone = "brand" | "success" | "warning" | "info" | "danger" | "premium" | "neutral";

/** Tinted pill/badge: soft fill, outline and readable text. */
export const TONE_BADGE: Record<Tone, string> = {
  brand: "bg-accent text-accent-foreground border-primary/25",
  success: "bg-success-soft text-success-fg border-success-border",
  warning: "bg-warning-soft text-warning-fg border-warning-border",
  info: "bg-info-soft text-info-fg border-info-border",
  danger: "bg-danger-soft text-danger-fg border-danger-border",
  premium: "bg-premium-soft text-premium-fg border-premium-border",
  neutral: "bg-secondary text-secondary-foreground border-border",
};

/** Square icon chip on stat tiles and list rows. */
export const TONE_ICON: Record<Tone, string> = {
  brand: "bg-accent text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  danger: "bg-danger-soft text-danger",
  premium: "bg-premium-soft text-premium",
  neutral: "bg-secondary text-muted-foreground",
};

/** Solid accent for a row's left edge (e.g. triage severity). */
export const TONE_EDGE: Record<Tone, string> = {
  brand: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-danger",
  premium: "bg-premium",
  neutral: "bg-border",
};
