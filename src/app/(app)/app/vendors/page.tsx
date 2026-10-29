import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createVendorAction, deleteVendorAction } from "@/app/actions/vendors";
import { RbacAction } from "@/domain/rbac/actions";
import { can, canMutate } from "@/domain/rbac/can";
import { listStores } from "@/domain/stores/store-service";
import { listVendors } from "@/domain/vendors/vendor-service";
import { t } from "@/i18n";

export default async function VendorsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }

  const msg = t("it");
  const [vendors, stores] = await Promise.all([
    listVendors(session.tenantId),
    listStores(session.tenantId),
  ]);
  const canEdit = canMutate(session.role, RbacAction.crudVendor);
  const canScorecard = can(session.role, RbacAction.dashboardHq);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.vendor.listTitle}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {msg.vendor.listHint}
          </p>
        </div>
        {canScorecard ? (
          <Link
            href="/app/vendors/scorecard"
            className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
          >
            {msg.scorecard.linkList}
          </Link>
        ) : null}
      </div>

      {canEdit ? (
        <form
          action={async (fd) => {
            "use server";
            await createVendorAction({}, fd);
          }}
          className="mt-8 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
        >
          <input
            name="name"
            required
            placeholder="Ragione sociale"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
            />
            <input
              name="phone"
              placeholder="Telefono"
              className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
            />
          </div>
          <input
            name="trades"
            placeholder="Mestieri (es. frigo, hvac)"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
          {stores.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                {msg.vendor.coverageLegend}
              </legend>
              <div className="flex flex-wrap gap-3">
                {stores.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="storeCoverageIds" value={s.id} />
                    {s.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              {msg.vendor.needStoresHint}
            </p>
          )}
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {msg.vendor.add}
          </button>
        </form>
      ) : null}

      <ul className="mt-10 divide-y divide-[var(--border)]">
        {vendors.length === 0 ? (
          <li className="py-6 text-sm text-[var(--muted-foreground)]">
            {msg.vendor.emptyList}
          </li>
        ) : (
          vendors.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <Link
                  href={`/app/vendors/${v.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {v.name}
                </Link>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {v.trades.length ? v.trades.join(", ") : "—"}
                  {v.storeCoverageIds.length
                    ? ` · ${v.storeCoverageIds.length} store`
                    : ""}
                </p>
              </div>
              {canEdit ? (
                <form
                  action={async () => {
                    "use server";
                    await deleteVendorAction(v.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-sm text-[var(--critical)] underline-offset-4 hover:underline"
                  >
                    {msg.vendor.archive}
                  </button>
                </form>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
