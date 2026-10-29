import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createStoreAction, deleteStoreAction } from "@/app/actions/stores";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { listStores } from "@/domain/stores/store-service";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function StoresPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }

  const msg = await tenantMessages(session.tenantId);
  const stores = await listStores(session.tenantId);
  const canEdit = canMutate(session.role, RbacAction.crudStore);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.stores.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
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
          className="mt-8 grid gap-3 sm:grid-cols-2"
        >
          <input
            name="name"
            required
            placeholder={msg.stores.namePlaceholder}
            className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
          <input
            name="city"
            placeholder={msg.stores.cityPlaceholder}
            className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
          <input
            name="address"
            placeholder={msg.stores.addressPlaceholder}
            className="sm:col-span-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
          <input
            name="webhookUrl"
            placeholder={msg.stores.webhookPlaceholder}
            className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
          />
          <input
            name="ntfyTopic"
            placeholder={msg.stores.ntfyPlaceholder}
            className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="sm:col-span-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {msg.stores.add}
          </button>
        </form>
      ) : null}

      <ul className="mt-10 divide-y divide-[var(--border)]">
        {stores.length === 0 ? (
          <li className="py-6 text-sm text-[var(--muted-foreground)]">
            {msg.stores.empty}
          </li>
        ) : (
          stores.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="font-medium">
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
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {[s.city, s.address].filter(Boolean).join(" · ") || "—"}
                  {s.webhookUrl || s.ntfyTopic
                    ? ` · push ${[s.ntfyTopic && "ntfy", s.webhookUrl && "webhook"].filter(Boolean).join("+")}`
                    : ""}
                </p>
              </div>
              {canEdit ? (
                <div className="flex items-center gap-3">
                  <Link
                    href={`/app/stores/${s.id}`}
                    className="text-sm text-[var(--primary)] underline-offset-4 hover:underline"
                  >
                    Modifica
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
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
