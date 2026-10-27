interface PanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Link or button at the top right of the panel. */
  action?: React.ReactNode;
  /** Remove body padding, for tables and lists that run edge to edge. */
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** The standard white card that groups a section of a page. */
export function Panel({ title, description, action, flush, className = "", children }: PanelProps) {
  return (
    <section className={`bg-card border border-border rounded-xl shadow-xs ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-border">
          <div className="min-w-0">
            {title && <h2 className="font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

interface EmptyProps {
  icon: React.ElementType;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, children, action }: EmptyProps) {
  return (
    <div className="py-12 px-6 text-center">
      <span className="mx-auto mb-4 w-12 h-12 rounded-full bg-secondary inline-flex items-center justify-center">
        <Icon className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      {children && <div className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Horizontal scroll wrapper so wide tables never push the page sideways on phones. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}
