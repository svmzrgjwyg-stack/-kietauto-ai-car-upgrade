export default function Loading() {
  return <div role="status" aria-label="Loading" className="space-y-4 py-4">
    <div className="h-8 w-2/3 rounded-xl bg-[var(--brand-soft)]" />
    <div className="h-44 rounded-3xl bg-[var(--brand-soft)]" />
    <div className="h-32 rounded-3xl bg-[var(--wash)]" />
    <span className="sr-only">Loading…</span>
  </div>;
}
