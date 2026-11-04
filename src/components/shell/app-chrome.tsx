import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";
import { HqShell } from "./hq-shell";
import {
  hqSidebarItems,
  shellAudienceForRole,
  storeBottomItems,
  vendorBottomItems,
} from "./nav-config";
import { PhoneShell } from "./phone-shell";

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return <>{children}</>;

  const prefs = session.tenantId
    ? await getTenantI18nPrefs(session.tenantId)
    : { locale: "it" as const, currency: "EUR", dateLocale: "it-IT" };
  const msg = t(prefs.locale);
  const audience = shellAudienceForRole(session.role);

  const topRight = (
    <>
      <NotificationBell
        role={session.role}
        labels={msg.notifBell}
        dateLocale={prefs.dateLocale}
        currency={prefs.currency}
        locale={prefs.locale}
      />
      <form action="/logout" method="post">
        <Button type="submit" variant="outline" size="sm">
          {msg.nav.signOut}
        </Button>
      </form>
    </>
  );

  if (audience === "hq") {
    return (
      <HqShell
        brand={msg.appName}
        items={hqSidebarItems(session.role, prefs.locale)}
        topRight={topRight}
      >
        {children}
      </HqShell>
    );
  }

  return (
    <PhoneShell
      brand={msg.appName}
      items={
        audience === "vendor"
          ? vendorBottomItems(prefs.locale)
          : storeBottomItems(prefs.locale)
      }
      topRight={topRight}
    >
      {children}
    </PhoneShell>
  );
}
