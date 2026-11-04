import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createVendorAction, deleteVendorAction } from "@/app/actions/vendors";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { VendorsDataTable } from "@/components/tables/entity-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiCheckPicker } from "@/components/ui/multi-check-picker";
import { StatusPanel } from "@/components/ui/status-panel";
import { RbacAction } from "@/domain/rbac/actions";
import { can, canMutate } from "@/domain/rbac/can";
import { listStores } from "@/application/stores/store-service";
import { listVendors } from "@/application/vendors/vendor-service";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function VendorsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }

  const [msg, prefs, vendors, stores] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
    listVendors(session.tenantId),
    listStores(session.tenantId),
  ]);
  const canEdit = canMutate(session.role, RbacAction.crudVendor);
  const canScorecard = can(session.role, RbacAction.dashboardHq);

  return (
    <PageFrame>
      <div data-tour="page.vendors.root">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.vendor.listTitle}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {msg.vendor.listHint}
          </p>
        </div>
        {canScorecard ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/app/vendors/scorecard">{msg.scorecard.linkList}</Link>
          </Button>
        ) : null}
      </div>

      {canEdit ? (
        <form
          action={async (fd) => {
            "use server";
            await createVendorAction({}, fd);
          }}
          className="mt-6 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
        >
          <Input
            name="name"
            required
            placeholder={msg.vendor.namePlaceholder}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              name="email"
              type="email"
              placeholder={msg.vendor.emailPlaceholder}
            />
            <Input name="phone" placeholder={msg.vendor.phonePlaceholder} />
          </div>
          <Input name="trades" placeholder={msg.vendor.tradesPlaceholder} />
          {stores.length > 0 ? (
            <MultiCheckPicker
              name="storeCoverageIds"
              legend={msg.vendor.coverageLegend}
              options={stores.map((s) => ({ id: s.id, label: s.name }))}
              searchPlaceholder={msg.common.searchList}
              selectedCountLabel={msg.common.selectedCount}
              selectAllLabel={msg.common.selectAllFiltered}
              clearLabel={msg.common.clearSelection}
            />
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              {msg.vendor.needStoresHint}
            </p>
          )}
          <Button type="submit">{msg.vendor.add}</Button>
        </form>
      ) : null}

      {vendors.length === 0 ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            title={msg.vendor.emptyList}
            locale={prefs.locale}
          />
        </div>
      ) : (
        <div className="mt-6">
          <VendorsDataTable
            common={msg.common}
            nameHeader={msg.vendor.namePlaceholder}
            metaHeader={msg.vendor.tradesPlaceholder}
            editLabel={msg.vendor.edit}
            archiveLabel={msg.vendor.archive}
            canEdit={canEdit}
            onArchive={async (id) => {
              "use server";
              await deleteVendorAction(id);
            }}
            rows={vendors.map((v) => {
              const meta = [
                v.trades.length ? v.trades.join(", ") : "—",
                v.storeCoverageIds.length
                  ? `${v.storeCoverageIds.length} store`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ");
              return {
                id: v.id,
                name: v.name,
                meta,
                searchText: `${v.name} ${meta}`,
              };
            })}
          />
        </div>
      )}
    
      </div>
    </PageFrame>
  );
}
