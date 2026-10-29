import Link from "next/link";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { resumeOnboardingAction } from "@/app/actions/onboarding";
import {
  getHqOverview,
  listClosedTicketsForFinance,
} from "@/application/dashboard/hq-overview";
import { intakeCategoryLabel } from "@/domain/intake/chat-steps";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { roleLabel } from "@/domain/rbac/role-labels";
import { ticketStatusLabel } from "@/domain/ticket/status-labels";
import { getOnboardingSnapshot } from "@/domain/onboarding/progress";
import { DashboardKpiGrid } from "@/components/dashboard/kpi-metric-card";
import { StatusPanel } from "@/components/ui/status-panel";
import { tenantMessages } from "@/i18n/tenant-messages";
import { formatMoney, withCurrency } from "@/i18n/format";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");

  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const eur = (n: number) => formatMoney(n, prefs) ?? "—";
  const snap = await getOnboardingSnapshot(session.tenantId);

  if (!snap.networkComplete && !snap.skippedAt) {
    redirect("/onboarding");
  }

  const isFinance = session.role === Role.viewer_finance;
  const canHq = can(session.role, RbacAction.dashboardHq);
  const canGdpr = can(session.role, RbacAction.exportGdpr);
  const canAccounting = can(session.role, RbacAction.exportAccounting);

  if (!canHq) {
    redirect("/app/tickets");
  }

  const overview = await getHqOverview({
    tenantId: session.tenantId,
    role: session.role,
    rangeDays: 30,
  });

  const closed =
    isFinance || can(session.role, RbacAction.viewCosts)
      ? await listClosedTicketsForFinance({
          tenantId: session.tenantId,
          role: session.role,
          membership: {
            role: session.role,
            storeIds: [],
            deletedAt: null,
          },
          take: 20,
        })
      : [];

  const emptyOps =
    overview.openCount === 0 &&
    overview.costsTotal === 0 &&
    overview.mttrHours == null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {msg.dashboard.range30}
            {session.user?.name ? ` · ${session.user.name}` : null}
            {isFinance
              ? ` · ${roleLabel(session.role, prefs.locale)}`
              : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {!isFinance ? (
            <Link
              href="/app/tickets/new"
              className="rounded-[var(--radius)] bg-[var(--primary)] px-3 py-2 font-medium text-[var(--primary-foreground)]"
            >
              {msg.dashboard.ctaTicket}
            </Link>
          ) : null}
          {canAccounting ? (
            <a
              href="/api/exports/accounting"
              className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
              title={withCurrency(
                msg.accounting.exportHint,
                prefs.currency,
              )}
            >
              {msg.accounting.exportTitle}
            </a>
          ) : null}
          {canGdpr ? (
            <a
              href="/api/gdpr/export"
              className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
            >
              {msg.gdpr.exportTitle}
            </a>
          ) : null}
        </div>
      </div>

      {!snap.networkComplete ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            title={msg.dashboard.emptyTitle}
            body={msg.dashboard.emptyBody}
            locale={prefs.locale}
          >
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/onboarding"
                className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
              >
                {msg.dashboard.ctaOnboarding}
              </Link>
              <form action={resumeOnboardingAction}>
                <button type="submit" className="text-sm underline-offset-4 hover:underline">
                  {msg.dashboard.cancelSkip}
                </button>
              </form>
            </div>
          </StatusPanel>
        </div>
      ) : null}

      {emptyOps ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            title={msg.dashboard.emptyTitle}
            body={msg.dashboard.emptyBody}
            locale={prefs.locale}
          >
            {!isFinance ? (
              <Link
                href="/app/tickets/new"
                className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
              >
                {msg.dashboard.ctaTicket}
              </Link>
            ) : null}
          </StatusPanel>
        </div>
      ) : (
        <>
          <DashboardKpiGrid
            items={[
              { label: msg.dashboard.open, value: String(overview.openCount) },
              {
                label: msg.dashboard.breached,
                value: String(overview.breachedCount),
              },
              {
                label: msg.dashboard.atRisk,
                value: String(overview.atRiskCount),
              },
              {
                label: msg.dashboard.mttr,
                value:
                  overview.mttrHours == null
                    ? "—"
                    : `${overview.mttrHours.toFixed(1)} ${msg.dashboard.hours}`,
              },
              {
                label: msg.dashboard.costs,
                value: eur(overview.costsTotal),
              },
            ]}
          />

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {msg.dashboard.byStore}
            </h2>
            {overview.byStore.length === 0 ? (
              <div className="mt-3">
                <StatusPanel kind="empty" locale={prefs.locale} />
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                      <th className="py-2 pr-3 font-medium">
                        {msg.dashboard.storeCol}
                      </th>
                      <th className="py-2 pr-3 font-medium">{msg.dashboard.open}</th>
                      <th className="py-2 pr-3 font-medium">
                        {msg.dashboard.breached}
                      </th>
                      <th className="py-2 font-medium">{msg.dashboard.costs}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.byStore.map((row) => (
                      <tr
                        key={row.storeId}
                        className="border-b border-[var(--border)]/60"
                      >
                        <td className="py-2 pr-3">{row.storeName}</td>
                        <td className="py-2 pr-3 tabular-nums">{row.openCount}</td>
                        <td className="py-2 pr-3 tabular-nums">
                          {row.breachedCount}
                        </td>
                        <td className="py-2 tabular-nums">{eur(row.costs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {(isFinance || closed.length > 0) && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {msg.dashboard.closedList}
          </h2>
          {closed.length === 0 ? (
            <div className="mt-3">
              <StatusPanel kind="empty" locale={prefs.locale} />
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
              {closed.map((tk) => (
                <li key={tk.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>
                    {tk.store.name} ·{" "}
                    {intakeCategoryLabel(tk.category, prefs.locale)} ·{" "}
                    {ticketStatusLabel(tk.status, prefs.locale)}
                  </span>
                  <span className="tabular-nums text-[var(--muted-foreground)]">
                    {tk.actualCost != null ? eur(Number(tk.actualCost)) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {isFinance ? (
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              {msg.dashboard.financeReadonly}
            </p>
          ) : null}
        </section>
      )}

      {canGdpr ? (
        <p className="mt-8 text-xs text-[var(--muted-foreground)]">
          {msg.gdpr.region} · {msg.gdpr.retention}
        </p>
      ) : null}
    </main>
  );
}
