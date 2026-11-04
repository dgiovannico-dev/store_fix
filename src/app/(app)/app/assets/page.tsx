import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createAssetAction, deleteAssetAction } from "@/app/actions/assets";
import { listAssets } from "@/application/assets/asset-service";
import {
  intakeCategoryLabel,
  intakeCategoryOptions,
} from "@/domain/intake/chat-steps";
import { getActiveMembership } from "@/application/memberships/membership-service";
import { RbacAction } from "@/domain/rbac/actions";
import { can } from "@/domain/rbac/can";
import { listStores } from "@/application/stores/store-service";
import { listVendors } from "@/application/vendors/vendor-service";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { AssetsDataTable } from "@/components/tables/entity-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPanel } from "@/components/ui/status-panel";
import { controlClass } from "@/lib/ui-classes";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function AssetsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  if (!can(session.role, RbacAction.crudAsset)) redirect("/onboarding");

  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) redirect("/login");

  const [msg, prefs, assets, stores, vendors] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
    listAssets({ tenantId: session.tenantId, membership }),
    listStores(session.tenantId),
    listVendors(session.tenantId),
  ]);
  const copy = msg.assets;
  const categories = intakeCategoryOptions(prefs.locale);
  const storeName = new Map(stores.map((s) => [s.id, s.name]));

  return (
    <PageFrame>
      <div data-tour="page.assets.root">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {copy.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{copy.hint}</p>

      <form
        action={async (fd) => {
          "use server";
          await createAssetAction({}, fd);
        }}
        className="mt-6 grid gap-3 rounded-[var(--radius)] border border-[var(--border)] p-4 sm:grid-cols-2"
      >
        <select name="storeId" required className={controlClass}>
          <option value="">{copy.storePlaceholder}</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="category" required className={controlClass}>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <Input
          name="label"
          required
          placeholder={copy.labelPlaceholder}
          className="sm:col-span-2"
        />
        <Input name="brandModel" placeholder={copy.brandPlaceholder} />
        <Input name="location" placeholder={copy.locationPlaceholder} />
        <select name="preferredVendorId" className={`sm:col-span-2 ${controlClass}`}>
          <option value="">{copy.vendorPlaceholder}</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <Button type="submit" className="sm:col-span-2">
          {copy.add}
        </Button>
      </form>

      {assets.length === 0 ? (
        <div className="mt-8">
          <StatusPanel kind="empty" title={copy.empty} locale={prefs.locale} />
        </div>
      ) : (
        <div className="mt-6">
          <AssetsDataTable
            common={msg.common}
            labelHeader={copy.labelPlaceholder}
            storeHeader={copy.storePlaceholder}
            archiveLabel={copy.archive}
            onArchive={async (id) => {
              "use server";
              await deleteAssetAction(id);
            }}
            rows={assets.map((a) => {
              const category = intakeCategoryLabel(a.category, prefs.locale);
              const detail =
                [a.brandModel, a.location].filter(Boolean).join(" · ") || "—";
              const store = storeName.get(a.storeId) ?? "—";
              return {
                id: a.id,
                label: a.label,
                category,
                detail,
                storeName: store,
                searchText: `${a.label} ${category} ${detail} ${store}`,
              };
            })}
          />
        </div>
      )}
    
      </div>
    </PageFrame>
  );
}
