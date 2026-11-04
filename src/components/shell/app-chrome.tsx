import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import type { BreadcrumbLabels } from "@/components/layout/app-breadcrumbs";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { t } from "@/i18n";
import { HqShell } from "./hq-shell";
import {
  hqSidebarItems,
  navHomeForAudience,
  shellAudienceForRole,
  storeBottomItems,
  vendorBottomItems,
} from "./nav-config";
import { PhoneShell } from "./phone-shell";

function breadcrumbLabelsFromMsg(
  msg: ReturnType<typeof t>,
): BreadcrumbLabels {
  return {
    home: msg.common.home,
    breadcrumb: msg.common.breadcrumb,
    detail: msg.common.detail,
    newItem: msg.common.newItem,
    importCsv: msg.stores.importCsv,
    scorecard: msg.scorecard.title,
    members: msg.members.title,
    audit: msg.audit.title,
    locale: msg.nav.locale,
    routes: {
      dashboard: msg.nav.dashboard,
      tickets: msg.nav.tickets,
      stores: msg.nav.stores,
      vendors: msg.nav.vendors,
      assets: msg.nav.assets,
      contratti: msg.nav.contracts,
      calendario: msg.nav.calendar,
      rfq: msg.nav.rfq,
      segnala: msg.nav.segnala,
      settings: msg.nav.locale,
      inbox: msg.nav.inbox,
      onboarding: msg.onboarding.title,
    },
  };
}

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // Fail-closed: (app)/(vendor) layouts always wrap AppChrome
  if (!session?.user) redirect("/login");


  const prefs = session.tenantId
    ? await getTenantI18nPrefs(session.tenantId)
    : { locale: "it" as const, currency: "EUR", dateLocale: "it-IT" };
  const msg = t(prefs.locale);
  const audience = shellAudienceForRole(session.role);
  const homeHref = navHomeForAudience(audience);

  const topRight = (
    <NotificationBell
      role={session.role}
      labels={msg.notifBell}
      dateLocale={prefs.dateLocale}
      currency={prefs.currency}
      locale={prefs.locale}
    />
  );

  if (audience === "hq") {
    return (
      <HqShell
        brand={msg.appName}
        items={hqSidebarItems(session.role, prefs.locale)}
        topRight={topRight}
        signOutLabel={msg.nav.signOut}
        breadcrumbLabels={breadcrumbLabelsFromMsg(msg)}
        homeHref={homeHref}
      >
        {children}
      </HqShell>
    );
  }

  return (
    <PhoneShell
      brand={msg.appName}
      audience={audience === "vendor" ? "vendor" : "store"}
      items={
        audience === "vendor"
          ? vendorBottomItems(prefs.locale)
          : storeBottomItems(prefs.locale)
      }
      topRight={topRight}
      signOutLabel={msg.nav.signOut}
      breadcrumbLabels={breadcrumbLabelsFromMsg(msg)}
      homeHref={homeHref}
    >
      {children}
    </PhoneShell>
  );
}
