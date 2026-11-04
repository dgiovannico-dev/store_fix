/** Instant feedback on HQ soft-nav while the RSC page resolves. */
export default function AppSegmentLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="h-8 w-48 rounded-[var(--radius)] bg-[var(--muted)]" />
      <div className="mt-3 h-4 w-72 max-w-full rounded-[var(--radius)] bg-[var(--muted)]" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-20 rounded-[var(--radius)] bg-[var(--muted)]" />
        <div className="h-20 rounded-[var(--radius)] bg-[var(--muted)]" />
        <div className="h-20 rounded-[var(--radius)] bg-[var(--muted)]" />
        <div className="h-20 rounded-[var(--radius)] bg-[var(--muted)]" />
      </div>
      <div className="mt-8 h-64 rounded-[var(--radius)] bg-[var(--muted)]" />
    </div>
  );
}
