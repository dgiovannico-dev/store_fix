import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createStoreAction, deleteStoreAction } from "@/app/actions/stores";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          <Link
            href="/app/stores/import"
            className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
          >
            {msg.stores.importCsv}
          </Link>
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
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[length:var(--text-caption)] uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="py-2 pr-3 font-medium">{msg.stores.namePlaceholder}</th>
                <th className="py-2 pr-3 font-medium">{msg.stores.cityPlaceholder}</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--border)]/70 hover:bg-[var(--muted)]/40"
                >
                  <td className="py-2.5 pr-3 font-medium">
                    {canEdit ? (
                      <Link
                        href={`/app/stores/${s.id}`}
                        className="text-[var(--primary)] hover:underline"
                      >
                        {s.name}
                      </Link>
                    ) : (
                      s.name
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-[var(--muted-foreground)]">
                    {[s.city, s.address].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    {canEdit ? (
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/app/stores/${s.id}`}
                          className="text-sm text-[var(--primary)] underline-offset-4 hover:underline"
                        >
                          {msg.stores.edit}
                        </Link>
                        <form
                          action={async () => {
                            "use server";
                            await deleteStoreAction(s.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-sm text-[var(--critical)] underline-offset-4 hover:underline"
                          >
                            {msg.stores.archive}
                          </button>
                        </form>
                      </div>
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
