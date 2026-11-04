import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { listVendorQuoteBids } from "@/application/rfq/rfq-service";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { SimpleLinkDataTable } from "@/components/tables/entity-data-table";
import { StatusPanel } from "@/components/ui/status-panel";
import {
  rfqBidStatusLabel,
  rfqRequestStatusLabel,
} from "@/domain/rfq/status-labels";
import { formatMoney } from "@/i18n/format";
import { tenantMessages } from "@/i18n/tenant-messages";
import { prisma } from "@/infrastructure/db/prisma";

export default async function VendorRfqListPage() {
  const session = await auth();
  if (!session?.tenantId || !session.user?.id || session.role !== Role.vendor) {
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      tenantId: session.tenantId,
      userId: session.user.id,
      deletedAt: null,
    },
  });
  if (!membership?.vendorId) redirect("/vendor/inbox");

  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const bids = await listVendorQuoteBids({
    tenantId: session.tenantId,
    role: session.role,
    membership,
  });

  return (
    <main className="px-4 py-6">
      <h1 className="font-[family-name:var(--font-sora)] text-xl font-semibold text-[var(--primary)]">
        {msg.rfq.vendorTitle}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {msg.rfq.vendorHint}
      </p>
      {bids.length === 0 ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            title={msg.rfq.vendorEmpty}
            locale={prefs.locale}
          />
        </div>
      ) : (
        <div className="mt-3">
          <SimpleLinkDataTable
            common={msg.common}
            titleHeader={msg.rfq.title}
            metaHeader={msg.rfq.status}
            rows={bids.map((b) => {
              const meta = [
                rfqRequestStatusLabel(b.quoteRequest.status, prefs.locale),
                rfqBidStatusLabel(b.status, prefs.locale),
                b.amountEur != null ? formatMoney(b.amountEur, prefs) : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return {
                id: b.id,
                title: b.quoteRequest.title,
                meta,
                href: `/vendor/rfq/${b.quoteRequest.id}`,
                searchText: `${b.quoteRequest.title} ${meta}`,
              };
            })}
          />
        </div>
      )}
    </main>
  );
}
