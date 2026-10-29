import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listVendorScorecards } from "@/application/dashboard/vendor-scorecard";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { ForbiddenError } from "@/domain/rbac/guards";
import { t } from "@/i18n";

function eur(n: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function pct(rate: number | null) {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function days(n: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("it-IT", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

type Props = { searchParams: Promise<{ days?: string }> };

export default async function VendorScorecardPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");

  const msg = t("it");
  if (!can(session.role, RbacAction.dashboardHq)) {
    redirect("/app/tickets");
  }

  const sp = await searchParams;
  const rangeDays = Math.min(
    90,
    Math.max(7, Number.parseInt(sp.days ?? "30", 10) || 30),
  );

  let overview;
  try {
    overview = await listVendorScorecards({
      tenantId: session.tenantId,
      role: session.role,
      rangeDays,
    });
  } catch (e) {
    if (e instanceof ForbiddenError) redirect("/app/tickets");
    throw e;
  }

  const showCosts = can(session.role, RbacAction.viewCosts);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/app/vendors"
        className="text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline"
      >
        ← {msg.nav.vendors}
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {msg.scorecard.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {msg.scorecard.hint} · {msg.scorecard.rangeLabel} ({rangeDays}g)
      </p>

      {overview.rows.length === 0 ? (
        <p className="mt-10 text-sm text-[var(--muted-foreground)]">
          {msg.scorecard.empty}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                <th className="py-2 pr-3 font-medium">{msg.scorecard.colVendor}</th>
                <th className="py-2 pr-3 font-medium tabular-nums">
                  {msg.scorecard.colClosed}
                </th>
                <th className="py-2 pr-3 font-medium tabular-nums">
                  {msg.scorecard.colDays}
                </th>
                <th className="py-2 pr-3 font-medium tabular-nums">
                  {msg.scorecard.colSla}
                </th>
                <th className="py-2 pr-3 font-medium tabular-nums">
                  {msg.scorecard.colOpen}
                </th>
                {showCosts ? (
                  <th className="py-2 font-medium tabular-nums">
                    {msg.scorecard.colCosts}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {overview.rows.map((row) => (
                <tr
                  key={row.vendorId}
                  className="border-b border-[var(--border)]"
                >
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/app/vendors/${row.vendorId}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {row.vendorName}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{row.closedCount}</td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {days(row.avgResolutionDays)}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {pct(row.slaHitRate)}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {row.openAssignedCount}
                  </td>
                  {showCosts ? (
                    <td className="py-2.5 tabular-nums">
                      {eur(row.costsTotal)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
