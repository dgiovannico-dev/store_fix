import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createVendorContractAction,
  deleteVendorContractAction,
} from "@/app/actions/vendor-contracts";
import { RbacAction } from "@/domain/rbac/actions";
import { canMutate } from "@/domain/rbac/can";
import { listStores } from "@/application/stores/store-service";
import {
  canReadVendorContracts,
  listVendorContracts,
} from "@/application/vendor-contracts/vendor-contract-service";
import { listVendors } from "@/application/vendors/vendor-service";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { ContractsDataTable } from "@/components/tables/entity-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { StatusPanel } from "@/components/ui/status-panel";
import { formatMoney, withCurrency } from "@/i18n/format";
import { controlClass } from "@/lib/ui-classes";
import { tenantMessages } from "@/i18n/tenant-messages";

function expiryTone(endsOn: Date, now: Date) {
  if (endsOn.getTime() < now.getTime()) return "text-[var(--critical)]";
  const days =
    (endsOn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 60) return "text-[var(--signal-foreground)]";
  return "text-[var(--muted-foreground)]";
}

type Props = { searchParams: Promise<{ all?: string }> };

export default async function ContrattiPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canReadVendorContracts(session.role)) redirect("/app/tickets");

  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const dayLabel = (d: Date) => d.toLocaleDateString(prefs.dateLocale);
  const money = (n: number) => formatMoney(n, prefs) ?? "—";
  const sp = await searchParams;
  const showAll = sp.all === "1";
  const canEdit = canMutate(session.role, RbacAction.crudVendorContract);

  const [contracts, vendors, stores] = await Promise.all([
    listVendorContracts({
      tenantId: session.tenantId,
      role: session.role,
      expiringWithinDays: showAll ? null : 60,
    }),
    listVendors(session.tenantId),
    listStores(session.tenantId),
  ]);
  const now = new Date();

  return (
    <PageFrame>
      <div data-tour="page.contracts.root">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.contracts.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {showAll ? msg.contracts.hintAll : msg.contracts.hintExpiring}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={showAll ? "/app/contratti" : "/app/contratti?all=1"}>
            {showAll ? msg.contracts.filterExpiring : msg.contracts.filterAll}
          </Link>
        </Button>
      </div>

      {canEdit && vendors.length > 0 ? (
        <form
          action={async (fd) => {
            "use server";
            await createVendorContractAction({}, fd);
          }}
          className="mt-6 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
        >
          <p className="text-sm font-medium">{msg.contracts.add}</p>
          <select
            name="vendorId"
            required
            className={controlClass}
            defaultValue=""
          >
            <option value="" disabled>
              {msg.contracts.vendorPlaceholder}
            </option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <select name="storeId" className={controlClass} defaultValue="">
            <option value="">{msg.contracts.networkWide}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Input
            name="title"
            required
            minLength={2}
            placeholder={msg.contracts.titlePlaceholder}
          />
          <Input
            name="reference"
            placeholder={msg.contracts.referencePlaceholder}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              {msg.contracts.startsOn}
              <Input name="startsOn" type="date" required className="mt-1" />
            </label>
            <label className="text-sm">
              {msg.contracts.endsOn}
              <Input name="endsOn" type="date" required className="mt-1" />
            </label>
          </div>
          <Input
            name="annualFee"
            type="number"
            step="0.01"
            min="0"
            placeholder={withCurrency(
              msg.contracts.feePlaceholder,
              prefs.currency,
            )}
          />
          <PendingSubmitButton
            label={msg.contracts.save}
            pendingLabel={msg.common.working}
          />
        </form>
      ) : null}

      {contracts.length === 0 ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            title={msg.contracts.empty}
            locale={prefs.locale}
          />
        </div>
      ) : (
        <div className="mt-6">
          <ContractsDataTable
            common={msg.common}
            titleHeader={msg.contracts.titlePlaceholder}
            vendorHeader={msg.contracts.vendorPlaceholder}
            endsHeader={msg.contracts.endsOn}
            archiveLabel={msg.contracts.archive}
            canEdit={canEdit}
            onArchive={async (id, vendorId) => {
              "use server";
              await deleteVendorContractAction(id, vendorId);
            }}
            rows={contracts.map((c) => {
              const scope = c.store
                ? c.store.name
                : msg.contracts.networkWide;
              const period = `${dayLabel(c.startsOn)} → ${dayLabel(c.endsOn)}${
                c.annualFee != null ? ` · ${money(Number(c.annualFee))}` : ""
              }`;
              return {
                id: c.id,
                vendorId: c.vendorId,
                title: c.title,
                reference: c.reference ?? "",
                vendorName: c.vendor.name,
                scope,
                period,
                toneClass: expiryTone(c.endsOn, now),
                searchText: `${c.title} ${c.reference ?? ""} ${c.vendor.name} ${scope} ${period}`,
              };
            })}
          />
        </div>
      )}
    
      </div>
    </PageFrame>
  );
}
