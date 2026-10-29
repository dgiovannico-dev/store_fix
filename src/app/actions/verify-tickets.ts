"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { rejectTicket, verifyTicket } from "@/application/tickets/verify-ticket";
import { getActiveMembership } from "@/domain/memberships/membership-service";

export type VerifyActionState = { error?: string; ok?: boolean };

async function ctx() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) return null;
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) return null;
  return { session, membership };
}

export async function verifyTicketAction(
  _prev: VerifyActionState,
  formData: FormData,
): Promise<VerifyActionState> {
  const c = await ctx();
  if (!c) return { error: "Accesso richiesto" };
  const ticketId = String(formData.get("ticketId") ?? "");
  const result = await verifyTicket({
    tenantId: c.session.tenantId!,
    ticketId,
    actorUserId: c.session.user!.id!,
    role: c.session.role!,
    membership: c.membership,
  });
  if (!result.ok) return { error: result.message };
  revalidatePath(`/app/tickets/${ticketId}`);
  revalidatePath("/app/tickets");
  revalidatePath("/vendor/inbox");
  return { ok: true };
}

export async function rejectTicketAction(
  _prev: VerifyActionState,
  formData: FormData,
): Promise<VerifyActionState> {
  const c = await ctx();
  if (!c) return { error: "Accesso richiesto" };
  const ticketId = String(formData.get("ticketId") ?? "");
  const result = await rejectTicket({
    tenantId: c.session.tenantId!,
    ticketId,
    actorUserId: c.session.user!.id!,
    role: c.session.role!,
    membership: c.membership,
    reason: String(formData.get("reason") ?? ""),
  });
  if (!result.ok) return { error: result.message };
  revalidatePath(`/app/tickets/${ticketId}`);
  revalidatePath("/app/tickets");
  revalidatePath("/vendor/inbox");
  revalidatePath(`/vendor/tickets/${ticketId}`);
  return { ok: true };
}
