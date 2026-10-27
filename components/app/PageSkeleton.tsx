/** Placeholder shown while a portal page loads its data (app/(role)/loading.tsx). */
export function PageSkeleton() {
  return (
    <div className="max-w-6xl animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-24 rounded bg-secondary mb-3" />
      <div className="h-7 w-72 max-w-full rounded bg-secondary mb-2" />
      <div className="h-4 w-96 max-w-full rounded bg-secondary mb-8" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="h-72 rounded-xl border border-border bg-card" />
    </div>
  );
}
