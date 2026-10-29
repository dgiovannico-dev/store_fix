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
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { listStores } from "@/domain/stores/store-service";
import { listVendors } from "@/domain/vendors/vendor-service";
import { dateLocaleFor } from "@/i18n";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function CalendarioPmPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canManagePm(session.role)) redirect("/app/tickets");

  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const dLocale = dateLocaleFor(prefs.locale);
  const copy = msg.pm;
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
        {copy.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {copy.hint}
      </p>

      {stores.length > 0 ? (
        <form
          action={async (fd) => {
            "use server";
            await createPmEventAction({}, fd);
          }}
          className="mt-8 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
        >
          <p className="text-sm font-medium">{copy.add}</p>
          <input
            name="title"
            required
            minLength={2}
            placeholder={copy.titlePlaceholder}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
          />
          <select
            name="storeId"
            required
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              {copy.storePlaceholder}
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
            <option value="">{copy.vendorPlaceholder}</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              {copy.dateLabel}
              <input
                name="scheduledDate"
                type="date"
                required
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
              />
            </label>
            <label className="text-sm">
              {copy.timeLabel}
              <input
                name="scheduledTime"
                type="time"
                defaultValue="09:00"
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            {copy.recurrenceLabel}
            <select
              name="recurrence"
              defaultValue="none"
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="none">{copy.recurrenceNone}</option>
              <option value="weekly">{copy.recurrenceWeekly}</option>
              <option value="monthly">{copy.recurrenceMonthly}</option>
              <option value="quarterly">{copy.recurrenceQuarterly}</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {copy.schedule}
          </button>
        </form>
      ) : null}

      <ul className="mt-10 divide-y divide-[var(--border)]">
        {events.length === 0 ? (
          <li className="py-6 text-sm text-[var(--muted-foreground)]">
            {copy.empty}
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
                    {e.scheduledAt.toLocaleString(dLocale)}
                    {overdue ? ` · ${copy.overdue}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/app/tickets/new?storeId=${encodeURIComponent(e.storeId)}`}
                    className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-sm"
                  >
                    {copy.openTicket}
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
                      {copy.done}
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
                      {copy.cancel}
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
