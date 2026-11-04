import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createVendorContractAction,
  deleteVendorContractAction,
} from "@/app/actions/vendor-contracts";
import { RbacAction } from "@/domain/rbac/actions";
import { canMutate } from "@/domain/rbac/can";
import { listStores } from "@/domain/stores/store-service";
import {
  canReadVendorContracts,
  listVendorContracts,
} from "@/domain/vendor-contracts/vendor-contract-service";
import { listVendors } from "@/domain/vendors/vendor-service";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPanel } from "@/components/ui/status-panel";
import { formatMoney, withCurrency } from "@/i18n/format";
import { controlClass, tableHeadClass, tableRowClass } from "@/lib/ui-classes";
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
          <Button type="submit">{msg.contracts.save}</Button>
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
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className={tableHeadClass}>
                <th className="py-2 pr-3 font-medium">
                  {msg.contracts.titlePlaceholder}
                </th>
                <th className="py-2 pr-3 font-medium">
                  {msg.contracts.vendorPlaceholder}
                </th>
                <th className="py-2 pr-3 font-medium">{msg.contracts.endsOn}</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className={tableRowClass}>
                  <td className="py-2.5 pr-3 font-medium">
                    {c.title}
                    {c.reference ? (
                      <p className="text-xs font-normal text-[var(--muted-foreground)]">
                        {c.reference}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/app/vendors/${c.vendorId}`}
                      className="text-[var(--primary)] hover:underline"
                    >
                      {c.vendor.name}
                    </Link>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {c.store
                        ? c.store.name
                        : msg.contracts.networkWide}
                    </p>
                  </td>
                  <td className={`py-2.5 pr-3 tabular-nums ${expiryTone(c.endsOn, now)}`}>
                    {dayLabel(c.startsOn)} → {dayLabel(c.endsOn)}
                    {c.annualFee != null
                      ? ` · ${money(Number(c.annualFee))}`
                      : ""}
                  </td>
                  <td className="py-2.5 text-right">
                    {canEdit ? (
                      <form
                        action={async () => {
                          "use server";
                          await deleteVendorContractAction(c.id, c.vendorId);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-sm text-[var(--critical)] underline-offset-4 hover:underline"
                        >
                          {msg.contracts.archive}
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageFrame>
  );
}
