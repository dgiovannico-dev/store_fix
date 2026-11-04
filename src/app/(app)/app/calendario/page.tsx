import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canManagePm, listPmEvents } from "@/application/pm/pm-event-service";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { listStores } from "@/application/stores/store-service";
import { listVendors } from "@/application/vendors/vendor-service";
import { PageFrame } from "@/components/layout/page-frame";
import { addMonths, endOfMonth, startOfMonth } from "@/lib/calendar/grid";
import { dateLocaleFor } from "@/i18n";
import { tenantMessages } from "@/i18n/tenant-messages";

const PmCalendar = dynamic(
  () =>
    import("@/components/calendar/pm-calendar").then((m) => m.PmCalendar),
  {
    loading: () => (
      <div className="mt-4 h-[28rem] animate-pulse rounded-[var(--radius)] bg-[var(--muted)]" />
    ),
  },
);

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
        copy={copy}
      />
    
      </div>
    </PageFrame>
  );
}
