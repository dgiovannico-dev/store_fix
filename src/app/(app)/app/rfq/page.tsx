import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listQuoteRequests } from "@/application/rfq/rfq-service";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
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
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
          {msg.rfq.title}
        </h1>
        <Link
          href="/app/rfq/new"
          className="rounded-[var(--radius)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          {msg.rfq.add}
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{msg.rfq.hint}</p>

      {items.length === 0 ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            title={msg.rfq.empty}
            locale={prefs.locale}
          />
        </div>
      ) : (
      <ul className="mt-8 divide-y divide-[var(--border)]">
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
              <li key={r.id} className="py-4">
                <Link
                  href={`/app/rfq/${r.id}`}
                  className="font-medium text-[var(--primary)] hover:underline"
                >
                  {r.title}
                </Link>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {rfqRequestStatusLabel(r.status, prefs.locale)} ·{" "}
                  {msg.rfq.invitesMeta.replace("{n}", String(r.bids.length))} ·{" "}
                  {msg.rfq.submittedMeta.replace(
                    "{n}",
                    String(submitted.length),
                  )}
                  {min ? ` · ${min}` : ""}
                  {r.ticketId ? ` · ${r.ticketId.slice(0, 8)}…` : ""}
                </p>
              </li>
            );
          })}
      </ul>
      )}
    </main>
  );
}
