interface Props {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small label above the title, e.g. the portal section. */
  eyebrow?: string;
  /** Buttons or links shown on the right (below the title on phones). */
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-foreground">{title}</h1>
        {description && <div className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
