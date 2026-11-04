import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listQuoteRequests } from "@/application/rfq/rfq-service";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { RfqDataTable } from "@/components/tables/entity-data-table";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { rfqRequestStatusLabel } from "@/domain/rfq/status-labels";
import { formatMoney } from "@/i18n/format";
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
      <div data-tour="page.rfq.root">
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
        <div className="mt-6">
          <RfqDataTable
            common={msg.common}
            titleHeader={msg.rfq.title}
            statusHeader={msg.rfq.status}
            offersHeader={msg.rfq.offers}
            minHeader={msg.rfq.colMin}
            rows={items.map((r) => {
              const submitted = r.bids.filter((b) => b.status === "submitted");
              const amounts = submitted
                .map((b) => Number(b.amountEur))
                .filter((n) => Number.isFinite(n));
              const min =
                amounts.length > 0
                  ? (formatMoney(Math.min(...amounts), prefs) ?? "—")
                  : "—";
              const status = rfqRequestStatusLabel(r.status, prefs.locale);
              const offers = `${msg.rfq.submittedMeta.replace("{n}", String(submitted.length))} / ${msg.rfq.invitesMeta.replace("{n}", String(r.bids.length))}`;
              const ticketHint = r.ticketId ? `${r.ticketId.slice(0, 8)}…` : "";
              return {
                id: r.id,
                title: r.title,
                status,
                offers,
                min,
                ticketHint,
                searchText: `${r.title} ${status} ${offers} ${ticketHint}`,
              };
            })}
          />
        </div>
      )}
    
      </div>
    </PageFrame>
  );
}
