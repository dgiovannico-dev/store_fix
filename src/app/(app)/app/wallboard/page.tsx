import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listWallboardTicketsPage } from "@/application/dashboard/wallboard-query";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { WallboardClient } from "@/components/wallboard/wallboard-client";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { ticketsListDeepLink } from "@/lib/app-urls";
import { qrSvgMarkup } from "@/lib/qr-svg";
import { tenantMessages } from "@/i18n/tenant-messages";

/** F6-09 — TV mode aperti + breach (HQ only). */
export default async function WallboardPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!can(session.role, RbacAction.dashboardHq)) redirect("/app/tickets");

  const ticketsUrl = ticketsListDeepLink();
  const [page, prefs, msg, qrSvg] = await Promise.all([
    listWallboardTicketsPage(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
    tenantMessages(session.tenantId),
    qrSvgMarkup(ticketsUrl),
  ]);

  return (
    <WallboardClient
      initialTickets={page.items}
      initialTotal={page.total}
      initialNextSkip={page.nextSkip}
      copy={msg.wallboard}
      locale={prefs.locale}
      qrSvg={qrSvg}
    />
  );
}
