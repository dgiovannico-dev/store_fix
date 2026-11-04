"use server";

import { auth } from "@/auth";
import { relaunchSlaTicket } from "@/application/sla/relaunch";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { t } from "@/i18n";

/** F6-04 — playbook breach one-click (nota template + relaunch). */
export async function breachPlaybookAction(ticketId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return { ok: false as const, code: "forbidden" };
  }
  const prefs = await getTenantI18nPrefs(session.tenantId);
  const note = t(prefs.locale).slaOps.playbookNote;
  return relaunchSlaTicket({
    tenantId: session.tenantId,
    ticketId,
    actorUserId: session.user.id,
    role: session.role,
    note,
  });
}
