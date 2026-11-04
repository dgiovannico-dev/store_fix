import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listQuoteRequests } from "@/application/rfq/rfq-service";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { rfqRequestStatusLabel } from "@/domain/rfq/status-labels";
import { formatMoney } from "@/i18n/format";
import { tableHeadClass, tableRowClass } from "@/lib/ui-classes";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function RfqListPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canMutate(session.role, RbacAction.manageRfq)) redirect("/app/tickets");

  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const items = await listQuoteRequests({
    tenantId: session.tenantId,
    role: session.role,
  });

  return (
    <PageFrame>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.rfq.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {msg.rfq.hint}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/app/rfq/new">{msg.rfq.add}</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            title={msg.rfq.empty}
            locale={prefs.locale}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className={tableHeadClass}>
                <th className="py-2 pr-3 font-medium">{msg.rfq.title}</th>
                <th className="py-2 pr-3 font-medium">{msg.rfq.status}</th>
                <th className="py-2 pr-3 font-medium">{msg.rfq.offers}</th>
                <th className="py-2 font-medium">{msg.rfq.colMin}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const submitted = r.bids.filter((b) => b.status === "submitted");
                const amounts = submitted
                  .map((b) => Number(b.amountEur))
                  .filter((n) => Number.isFinite(n));
                const min =
                  amounts.length > 0
                    ? formatMoney(Math.min(...amounts), prefs)
                    : null;
                return (
                  <tr key={r.id} className={tableRowClass}>
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/app/rfq/${r.id}`}
                        className="font-medium text-[var(--primary)] hover:underline"
                      >
                        {r.title}
                      </Link>
                      {r.ticketId ? (
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {r.ticketId.slice(0, 8)}…
                        </p>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3">
                      {rfqRequestStatusLabel(r.status, prefs.locale)}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-[var(--muted-foreground)]">
                      {msg.rfq.submittedMeta.replace(
                        "{n}",
                        String(submitted.length),
                      )}{" "}
                      /{" "}
                      {msg.rfq.invitesMeta.replace(
                        "{n}",
                        String(r.bids.length),
                      )}
                    </td>
                    <td className="py-2.5 tabular-nums">{min ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageFrame>
  );
}
