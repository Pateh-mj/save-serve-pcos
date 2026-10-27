/** Class strings for links and buttons that look like buttons, so every page matches. */
const base =
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 disabled:pointer-events-none";

export const btnPrimary = `${base} bg-primary text-primary-foreground shadow-xs hover:bg-primary/90`;
export const btnOutline = `${base} border border-border bg-card text-foreground hover:bg-secondary`;
export const btnDanger = `${base} border border-danger-border bg-danger-soft text-danger-fg hover:bg-danger-muted`;
export const btnSmall = "h-8 px-3 text-xs";

/** Form controls. */
export const inputCls =
  "w-full h-10 px-3.5 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-3 focus:ring-ring/30 focus:border-ring transition";
export const textareaCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-3 focus:ring-ring/30 focus:border-ring transition resize-none";
export const labelCls = "block text-sm font-medium text-foreground mb-1.5";
