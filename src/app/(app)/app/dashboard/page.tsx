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
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
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
    <PageFrame>
      <div data-tour="page.dashboard.root" className="space-y-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {msg.dashboard.range30}
            {isFinance
              ? ` · ${roleLabel(session.role, prefs.locale)}`
              : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isFinance ? (
            <Button asChild size="sm">
              <Link href="/app/tickets/new">{msg.dashboard.ctaTicket}</Link>
            </Button>
          ) : null}
          {canAccounting ? (
            <Button asChild variant="outline" size="sm">
              <a
                href="/api/exports/accounting"
                title={withCurrency(
                  msg.accounting.exportHint,
                  prefs.currency,
                )}
              >
                {msg.accounting.exportTitle}
              </a>
            </Button>
          ) : null}
          {canGdpr ? (
            <Button asChild variant="outline" size="sm">
              <a href="/api/gdpr/export">{msg.gdpr.exportTitle}</a>
            </Button>
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
              <Button asChild>
                <Link href="/onboarding">{msg.dashboard.ctaOnboarding}</Link>
              </Button>
              <form action={resumeOnboardingAction}>
                <button
                  type="submit"
                  className="text-sm underline-offset-4 hover:underline"
                >
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
            ariaLabel={msg.dashboard.kpiAria}
            items={[
              { label: msg.dashboard.open, value: String(overview.openCount) },
              {
                label: msg.dashboard.breached,
                value: String(overview.breachedCount),
                emphasize: "critical",
              },
              {
                label: msg.dashboard.atRisk,
                value: String(overview.atRiskCount),
                emphasize: "signal",
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

          <section className="mt-8" data-tour="page.dashboard.byStore">
            <h2 className="text-[length:var(--text-caption)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {msg.dashboard.byStore}
            </h2>
            {overview.byStore.length === 0 ? (
              <div className="mt-3">
                <StatusPanel kind="empty" locale={prefs.locale} />
              </div>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[length:var(--text-caption)] uppercase tracking-wide text-[var(--muted-foreground)]">
                      <th className="py-2 pr-3 font-medium">
                        {msg.dashboard.storeCol}
                      </th>
                      <th className="py-2 pr-3 font-medium">
                        {msg.dashboard.open}
                      </th>
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
                        className="border-b border-[var(--border)]/60 hover:bg-[var(--muted)]/40"
                      >
                        <td className="py-2 pr-3 font-medium">
                          {row.storeName}
                        </td>
                        <td className="py-2 pr-3 tabular-nums">
                          {row.openCount}
                        </td>
                        <td
                          className={`py-2 pr-3 tabular-nums ${
                            row.breachedCount > 0
                              ? "text-[var(--critical)]"
                              : ""
                          }`}
                        >
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
        <section className="mt-8">
          <h2 className="text-[length:var(--text-caption)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {msg.dashboard.closedList}
          </h2>
          {closed.length === 0 ? (
            <div className="mt-3">
              <StatusPanel kind="empty" locale={prefs.locale} />
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <tbody>
                  {closed.map((tk) => (
                    <tr
                      key={tk.id}
                      className="border-b border-[var(--border)]/60"
                    >
                      <td className="py-2 pr-3">
                        {tk.store.name} ·{" "}
                        {intakeCategoryLabel(tk.category, prefs.locale)} ·{" "}
                        {ticketStatusLabel(tk.status, prefs.locale)}
                      </td>
                      <td className="py-2 text-right tabular-nums text-[var(--muted-foreground)]">
                        {tk.actualCost != null
                          ? eur(Number(tk.actualCost))
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      </div>
    </PageFrame>
  );
}
