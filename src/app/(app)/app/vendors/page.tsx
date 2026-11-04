import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createVendorAction, deleteVendorAction } from "@/app/actions/vendors";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPanel } from "@/components/ui/status-panel";
import { RbacAction } from "@/domain/rbac/actions";
import { can, canMutate } from "@/domain/rbac/can";
import { listStores } from "@/domain/stores/store-service";
import { listVendors } from "@/domain/vendors/vendor-service";
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
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[length:var(--text-caption)] uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="py-2 pr-3 font-medium">
                  {msg.vendor.namePlaceholder}
                </th>
                <th className="py-2 pr-3 font-medium">
                  {msg.vendor.tradesPlaceholder}
                </th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-[var(--border)]/70 hover:bg-[var(--muted)]/40"
                >
                  <td className="py-2.5 pr-3 font-medium">
                    <Link
                      href={`/app/vendors/${v.id}`}
                      className="text-[var(--primary)] underline-offset-4 hover:underline"
                    >
                      {v.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 text-[var(--muted-foreground)]">
                    {v.trades.length ? v.trades.join(", ") : "—"}
                    {v.storeCoverageIds.length
                      ? ` · ${v.storeCoverageIds.length} store`
                      : ""}
                  </td>
                  <td className="py-2.5 text-right">
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
