import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createAssetAction, deleteAssetAction } from "@/app/actions/assets";
import { listAssets } from "@/domain/assets/asset-service";
import {
  INTAKE_CATEGORIES,
  intakeCategoryLabel,
} from "@/domain/intake/chat-steps";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { RbacAction } from "@/domain/rbac/actions";
import { can } from "@/domain/rbac/can";
import { listStores } from "@/domain/stores/store-service";
import { listVendors } from "@/domain/vendors/vendor-service";
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

  const [msg, assets, stores, vendors] = await Promise.all([
    tenantMessages(session.tenantId),
    listAssets({ tenantId: session.tenantId, membership }),
    listStores(session.tenantId),
    listVendors(session.tenantId),
  ]);
  const copy = msg.assets;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {copy.title}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">{copy.hint}</p>

      <form
        action={async (fd) => {
          "use server";
          await createAssetAction({}, fd);
        }}
        className="mt-8 grid gap-3 sm:grid-cols-2"
      >
        <select
          name="storeId"
          required
          className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
        >
          <option value="">{copy.storePlaceholder}</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="category"
          required
          className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
        >
          {INTAKE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          name="label"
          required
          placeholder={copy.labelPlaceholder}
          className="sm:col-span-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
        />
        <input
          name="brandModel"
          placeholder={copy.brandPlaceholder}
          className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
        />
        <input
          name="location"
          placeholder={copy.locationPlaceholder}
          className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
        />
        <select
          name="preferredVendorId"
          className="sm:col-span-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
        >
          <option value="">{copy.vendorPlaceholder}</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="sm:col-span-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          {copy.add}
        </button>
      </form>

      <ul className="mt-10 divide-y divide-[var(--border)]">
        {assets.length === 0 ? (
          <li className="py-6 text-sm text-[var(--muted-foreground)]">
            {copy.empty}
          </li>
        ) : (
          assets.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="font-medium">
                  {a.label}{" "}
                  <span className="text-sm font-normal text-[var(--muted-foreground)]">
                    · {intakeCategoryLabel(a.category)}
                  </span>
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {[a.brandModel, a.location].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteAssetAction(a.id);
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-[var(--critical)] underline-offset-4 hover:underline"
                >
                  {copy.archive}
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
