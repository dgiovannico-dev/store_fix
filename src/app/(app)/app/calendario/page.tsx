import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  cancelPmEventAction,
  completePmEventAction,
  createPmEventAction,
} from "@/app/actions/pm-events";
import {
  canManagePm,
  listPmEvents,
} from "@/domain/pm/pm-event-service";
import { listStores } from "@/domain/stores/store-service";
import { listVendors } from "@/domain/vendors/vendor-service";
import { t } from "@/i18n";

export default async function CalendarioPmPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canManagePm(session.role)) redirect("/app/tickets");

  const msg = t("it");
  const [events, stores, vendors] = await Promise.all([
    listPmEvents({
      tenantId: session.tenantId,
      role: session.role,
      horizonDays: 30,
    }),
    listStores(session.tenantId),
    listVendors(session.tenantId),
  ]);
  const now = new Date();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {msg.pm.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {msg.pm.hint}
      </p>

      {stores.length > 0 ? (
        <form
          action={async (fd) => {
            "use server";
            await createPmEventAction({}, fd);
          }}
          className="mt-8 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
        >
          <p className="text-sm font-medium">{msg.pm.add}</p>
          <input
            name="title"
            required
            minLength={2}
            placeholder="Titolo visita"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
          />
          <select
            name="storeId"
            required
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Punto vendita
            </option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            name="vendorId"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="">Fornitore (opz.)</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Data
              <input
                name="scheduledDate"
                type="date"
                required
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Ora
              <input
                name="scheduledTime"
                type="time"
                defaultValue="09:00"
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            Ricorrenza
            <select
              name="recurrence"
              defaultValue="none"
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="none">Una tantum</option>
              <option value="weekly">Settimanale</option>
              <option value="monthly">Mensile</option>
              <option value="quarterly">Trimestrale</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            Pianifica
          </button>
        </form>
      ) : null}

      <ul className="mt-10 divide-y divide-[var(--border)]">
        {events.length === 0 ? (
          <li className="py-6 text-sm text-[var(--muted-foreground)]">
            {msg.pm.empty}
          </li>
        ) : (
          events.map((e) => {
            const overdue = e.scheduledAt.getTime() < now.getTime();
            return (
              <li
                key={e.id}
                className="flex flex-wrap items-start justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {e.store.name}
                    {e.vendor ? ` · ${e.vendor.name}` : ""}
                    {e.asset ? ` · ${e.asset.label}` : ""}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      overdue
                        ? "text-[var(--critical)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {e.scheduledAt.toLocaleString("it-IT")}
                    {overdue ? " · in ritardo" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/app/tickets/new?storeId=${encodeURIComponent(e.storeId)}`}
                    className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-sm"
                  >
                    Apri ticket
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await completePmEventAction(e.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-[var(--radius)] bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)]"
                    >
                      Fatto
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await cancelPmEventAction(e.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-sm text-[var(--critical)] underline-offset-4 hover:underline"
                    >
                      Annulla
                    </button>
                  </form>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </main>
  );
}
