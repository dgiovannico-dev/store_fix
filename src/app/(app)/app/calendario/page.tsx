import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canManagePm, listPmEvents } from "@/application/pm/pm-event-service";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { listStores } from "@/application/stores/store-service";
import { listVendors } from "@/application/vendors/vendor-service";
import { PmCalendar } from "@/components/calendar/pm-calendar";
import { PageFrame } from "@/components/layout/page-frame";
import { addMonths, endOfMonth, startOfMonth } from "@/lib/calendar/grid";
import { dateLocaleFor } from "@/i18n";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function CalendarioPmPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canManagePm(session.role)) redirect("/app/tickets");

  const now = new Date();
  const from = startOfMonth(addMonths(now, -1));
  const to = endOfMonth(addMonths(now, 3));

  const [msg, prefs, events, stores, vendors] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
    listPmEvents({
      tenantId: session.tenantId,
      role: session.role,
      from,
      to,
    }),
    listStores(session.tenantId),
    listVendors(session.tenantId),
  ]);
  const copy = msg.pm;
  const dLocale = dateLocaleFor(prefs.locale);

  return (
    <PageFrame className="max-w-none lg:max-w-[90rem]">
      <div data-tour="page.calendar.root">
      <PmCalendar
        locale={prefs.locale}
        dateLocale={dLocale}
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          scheduledAt: e.scheduledAt.toISOString(),
          storeId: e.storeId,
          storeName: e.store.name,
          vendorName: e.vendor?.name ?? null,
          assetLabel: e.asset?.label ?? null,
        }))}
        copy={{
          title: copy.title,
          hint: copy.hint,
          add: copy.add,
          empty: copy.empty,
          titlePlaceholder: copy.titlePlaceholder,
          storePlaceholder: copy.storePlaceholder,
          vendorPlaceholder: copy.vendorPlaceholder,
          dateLabel: copy.dateLabel,
          timeLabel: copy.timeLabel,
          recurrenceLabel: copy.recurrenceLabel,
          recurrenceNone: copy.recurrenceNone,
          recurrenceWeekly: copy.recurrenceWeekly,
          recurrenceMonthly: copy.recurrenceMonthly,
          recurrenceQuarterly: copy.recurrenceQuarterly,
          schedule: copy.schedule,
          overdue: copy.overdue,
          openTicket: copy.openTicket,
          done: copy.done,
          cancel: copy.cancel,
          today: copy.today,
          viewDay: copy.viewDay,
          viewWeek: copy.viewWeek,
          viewMonth: copy.viewMonth,
          outsideHours: copy.outsideHours,
          more: copy.more,
          createTitle: copy.createTitle,
          detailTitle: copy.detailTitle,
          close: copy.close,
          weekdays: copy.weekdays,
        }}
      />
    
      </div>
    </PageFrame>
  );
}
