import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createStoreAction, deleteStoreAction } from "@/app/actions/stores";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { StoresDataTable } from "@/components/tables/entity-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RowActionLink } from "@/components/ui/row-actions";
import { StatusPanel } from "@/components/ui/status-panel";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { listStores } from "@/domain/stores/store-service";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function StoresPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }

  const [msg, prefs, stores] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
    listStores(session.tenantId),
  ]);
  const canEdit = canMutate(session.role, RbacAction.crudStore);

  return (
    <PageFrame>
      <div data-tour="page.stores.root">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.stores.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {msg.stores.hint}
          </p>
        </div>
        {canEdit ? (
          <RowActionLink
            href="/app/stores/import"
            label={msg.stores.importCsv}
            variant="import"
          />
        ) : null}
      </div>

      {canEdit ? (
        <form
          action={async (fd) => {
            "use server";
            await createStoreAction({}, fd);
          }}
          className="mt-6 grid gap-3 rounded-[var(--radius)] border border-[var(--border)] p-4 sm:grid-cols-2"
        >
          <Input
            name="name"
            required
            placeholder={msg.stores.namePlaceholder}
          />
          <Input name="city" placeholder={msg.stores.cityPlaceholder} />
          <Input
            name="address"
            placeholder={msg.stores.addressPlaceholder}
            className="sm:col-span-2"
          />
          <Input
            name="webhookUrl"
            placeholder={msg.stores.webhookPlaceholder}
          />
          <Input name="ntfyTopic" placeholder={msg.stores.ntfyPlaceholder} />
          <Button type="submit" className="sm:col-span-2">
            {msg.stores.add}
          </Button>
        </form>
      ) : null}

      {stores.length === 0 ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            title={msg.stores.empty}
            locale={prefs.locale}
          />
        </div>
      ) : (
        <div className="mt-6">
          <StoresDataTable
            common={msg.common}
            nameHeader={msg.stores.namePlaceholder}
            locationHeader={msg.stores.cityPlaceholder}
            editLabel={msg.stores.edit}
            archiveLabel={msg.stores.archive}
            canEdit={canEdit}
            onArchive={async (id) => {
              "use server";
              await deleteStoreAction(id);
            }}
            rows={stores.map((s) => {
              const location =
                [s.city, s.address].filter(Boolean).join(" · ") || "—";
              return {
                id: s.id,
                name: s.name,
                location,
                searchText: `${s.name} ${location}`,
              };
            })}
          />
        </div>
      )}
    
      </div>
    </PageFrame>
  );
}
