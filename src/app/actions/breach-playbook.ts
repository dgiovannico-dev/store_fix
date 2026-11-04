"use server";

import { auth } from "@/auth";
import { relaunchSlaTicket } from "@/application/sla/relaunch";

/** F6-04 — playbook breach one-click (nota template + relaunch). */
export async function breachPlaybookAction(ticketId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return { ok: false as const, code: "unauthorized" };
  }
  return relaunchSlaTicket({
    tenantId: session.tenantId,
    ticketId,
    actorUserId: session.user.id,
    role: session.role,
    note: "Playbook breach: rilancio automatico — verificare vendor e aggiornare ETA entro 2h.",
  });
}
