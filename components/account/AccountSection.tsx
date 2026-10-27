/** Card wrapper shared by the account pages of every role. */
export default function AccountSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h2 className="font-bold text-foreground">{title}</h2>
      {description && <p className="text-xs text-muted-foreground mt-0.5 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </section>
  );
}
