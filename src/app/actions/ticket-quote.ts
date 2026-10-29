"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  decideTicketQuote,
  proposeTicketQuote,
} from "@/application/tickets/ticket-quote";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { actionError } from "@/i18n/action-errors";

export type QuoteActionState = { error?: string; ok?: boolean };

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

export async function proposeQuoteAction(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const c = await ctx();
  if (!c) return { error: await actionError("accessRequired") };
  const ticketId = String(formData.get("ticketId") ?? "");
  const result = await proposeTicketQuote({
    tenantId: c.session.tenantId!,
    ticketId,
    actorUserId: c.session.user!.id!,
    role: c.session.role!,
    membership: c.membership,
    data: {
      amountEur: formData.get("amountEur"),
      note: formData.get("note") || null,
    },
  });
  if (!result.ok) return { error: result.message };
  revalidatePath(`/vendor/tickets/${ticketId}`);
  revalidatePath(`/app/tickets/${ticketId}`);
  return { ok: true };
}

export async function decideQuoteAction(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const c = await ctx();
  if (!c) return { error: await actionError("accessRequired") };
  const ticketId = String(formData.get("ticketId") ?? "");
  const result = await decideTicketQuote({
    tenantId: c.session.tenantId!,
    ticketId,
    actorUserId: c.session.user!.id!,
    role: c.session.role!,
    membership: c.membership,
    data: {
      decision: formData.get("decision"),
      reason: formData.get("reason") || null,
    },
  });
  if (!result.ok) return { error: result.message };
  revalidatePath(`/app/tickets/${ticketId}`);
  revalidatePath(`/vendor/tickets/${ticketId}`);
  return { ok: true };
}
