import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listWallboardTicketsPage } from "@/application/dashboard/wallboard-query";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { WallboardClient } from "@/components/wallboard/wallboard-client";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { tenantMessages } from "@/i18n/tenant-messages";

/** F6-09 — TV mode aperti + breach (HQ only). */
export default async function WallboardPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!can(session.role, RbacAction.dashboardHq)) redirect("/app/tickets");

  const [page, prefs, msg] = await Promise.all([
    listWallboardTicketsPage(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
    tenantMessages(session.tenantId),
  ]);

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return (
    <WallboardClient
      initialTickets={page.items}
      initialTotal={page.total}
      initialNextSkip={page.nextSkip}
      copy={msg.wallboard}
      locale={prefs.locale}
      ticketsUrl={`${base}/app/tickets`}
    />
  );
}
