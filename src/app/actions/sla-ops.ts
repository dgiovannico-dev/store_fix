"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { relaunchSlaTicket } from "@/application/sla/relaunch";
import { getActiveMembership } from "@/domain/memberships/membership-service";

export type RelaunchState = { error?: string; ok?: boolean };

export async function relaunchSlaAction(
  _prev: RelaunchState,
  formData: FormData,
): Promise<RelaunchState> {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return { error: "Accesso richiesto" };
  }
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) return { error: "Membership non attiva" };

  const ticketId = String(formData.get("ticketId") ?? "");
  const result = await relaunchSlaTicket({
    tenantId: session.tenantId,
    ticketId,
    actorUserId: session.user.id,
    role: session.role,
    note: String(formData.get("note") ?? ""),
  });
  if (!result.ok) return { error: result.message };
  revalidatePath(`/app/tickets/${ticketId}`);
  return { ok: true };
}
