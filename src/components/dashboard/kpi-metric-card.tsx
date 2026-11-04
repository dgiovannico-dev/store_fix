/** Metric strip FinTech-density (F5-UX-04) — no decorative card chrome. */

export type KpiMetric = {
  label: string;
  value: string;
  emphasize?: "critical" | "signal" | "default";
};

export function KpiMetricCard({ label, value, emphasize = "default" }: KpiMetric) {
  const valueColor =
    emphasize === "critical"
      ? "text-[var(--critical)]"
      : emphasize === "signal"
        ? "text-[var(--signal-foreground)]"
        : "text-[var(--foreground)]";

  return (
    <div className="min-w-0 px-1 py-1">
      <p className="text-[length:var(--text-caption)] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p
        className={`mt-1 font-[family-name:var(--font-sora)] text-2xl font-semibold tabular-nums tracking-tight ${valueColor}`}
      >
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
      data-tour="page.dashboard.kpi"
      aria-label={ariaLabel}
      className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-[var(--border)] py-5 sm:grid-cols-3 lg:grid-cols-5"
    >
      {items.map((k) => (
        <KpiMetricCard key={k.label} {...k} />
      ))}
    </section>
  );
}
