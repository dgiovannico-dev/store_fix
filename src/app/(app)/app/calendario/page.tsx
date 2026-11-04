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
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RowActionLink, RowActionSubmit } from "@/components/ui/row-actions";
import { StatusPanel } from "@/components/ui/status-panel";
import { controlClass } from "@/lib/ui-classes";
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
    <PageFrame>
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
          <Input
            name="title"
            required
            minLength={2}
            placeholder={copy.titlePlaceholder}
          />
          <select
            name="storeId"
            required
            className={controlClass}
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
            className={controlClass}
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
                className={`mt-1 ${controlClass}`}
              />
            </label>
            <label className="text-sm">
              {copy.timeLabel}
              <input
                name="scheduledTime"
                type="time"
                defaultValue="09:00"
                className={`mt-1 ${controlClass}`}
              />
            </label>
          </div>
          <label className="block text-sm">
            {copy.recurrenceLabel}
            <select
              name="recurrence"
              defaultValue="none"
              className={`mt-1 ${controlClass}`}
            >
              <option value="none">{copy.recurrenceNone}</option>
              <option value="weekly">{copy.recurrenceWeekly}</option>
              <option value="monthly">{copy.recurrenceMonthly}</option>
              <option value="quarterly">{copy.recurrenceQuarterly}</option>
            </select>
          </label>
          <Button type="submit">{copy.schedule}</Button>
        </form>
      ) : null}

      {events.length === 0 ? (
        <div className="mt-10">
          <StatusPanel
            kind="empty"
            title={copy.empty}
            locale={prefs.locale}
          />
        </div>
      ) : (
      <ul className="mt-10 divide-y divide-[var(--border)]">
          {events.map((e) => {
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
                <div className="flex flex-wrap items-center gap-2">
                  <RowActionLink
                    href={`/app/tickets/new?storeId=${encodeURIComponent(e.storeId)}`}
                    label={copy.openTicket}
                    variant="openTicket"
                  />
                  <form
                    action={async () => {
                      "use server";
                      await completePmEventAction(e.id);
                    }}
                  >
                    <RowActionSubmit label={copy.done} variant="done" />
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await cancelPmEventAction(e.id);
                    }}
                  >
                    <RowActionSubmit label={copy.cancel} variant="cancel" />
                  </form>
                </div>
              </li>
            );
          })}
      </ul>
      )}
    </PageFrame>
  );
}
