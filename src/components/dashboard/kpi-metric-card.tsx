/** Presentational KPI tile (RSC-safe) — S4 refactor. */

export type KpiMetric = {
  label: string;
  value: string;
};

export function KpiMetricCard({ label, value }: KpiMetric) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-4">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-sora)] text-xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

export function DashboardKpiGrid({
  items,
  ariaLabel,
}: {
  items: KpiMetric[];
  ariaLabel: string;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {items.map((k) => (
        <KpiMetricCard key={k.label} label={k.label} value={k.value} />
      ))}
    </section>
  );
}
