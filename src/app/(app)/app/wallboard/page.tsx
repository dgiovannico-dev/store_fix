import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listWallboardTickets } from "@/application/dashboard/wallboard-query";
import { WallboardClient } from "@/components/wallboard/wallboard-client";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";

/** F6-09 — TV mode aperti + breach (HQ only). */
export default async function WallboardPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!can(session.role, RbacAction.dashboardHq)) redirect("/app/tickets");

  const tickets = await listWallboardTickets(session.tenantId);

  return <WallboardClient tickets={tickets} />;
}
