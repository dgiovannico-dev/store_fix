"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TicketPriority } from "@prisma/client";
import { auth } from "@/auth";
import { createTicket } from "@/application/tickets/create-ticket";
import {
  assignTicket,
  cancelTicket,
  triageTicket,
} from "@/application/tickets/transition-ticket";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { checkRateLimitPolicy } from "@/infrastructure/rate-limit";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

export type CreateTicketState = {
  error?: string;
  ticketId?: string;
};

export type TicketActionState = {
  error?: string;
  ok?: boolean;
};

async function sessionContext() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return null;
  }
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) return null;
  return { session, membership };
}

export async function createTicketAction(
  _prev: CreateTicketState,
  formData: FormData,
): Promise<CreateTicketState> {
  const ctx = await sessionContext();
  if (!ctx) return { error: await actionError("accessRequired") };

  const intakeLimit = checkRateLimitPolicy(
    `intake:${ctx.session.tenantId}:${ctx.session.user!.id}`,
    RATE_LIMIT.intake,
  );
  if (!intakeLimit.ok) {
    return {
      error: (await actionError("rateLimitedRetry")).replace(
        "{sec}",
        String(intakeLimit.retryAfterSec),
      ),
    };
  }

  const priorityRaw = String(formData.get("priority") ?? "normal");
  const priority = Object.values(TicketPriority).includes(
    priorityRaw as TicketPriority,
  )
    ? (priorityRaw as TicketPriority)
    : TicketPriority.normal;

  const result = await createTicket({
    tenantId: ctx.session.tenantId!,
    actorUserId: ctx.session.user!.id!,
    role: ctx.session.role!,
    membership: ctx.membership,
    data: {
      storeId: formData.get("storeId"),
      category: formData.get("category"),
      priority,
      description: formData.get("description"),
      assetId: formData.get("assetId") || null,
    },
  });

  if (!result.ok) return { error: await actionResultError(result) };

  revalidatePath("/app/tickets");
  redirect(`/app/tickets/${result.ticket.id}?created=1`);
}

export async function triageTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const ctx = await sessionContext();
  if (!ctx) return { error: await actionError("accessRequired") };
  const ticketId = String(formData.get("ticketId") ?? "");
  const result = await triageTicket({
    tenantId: ctx.session.tenantId!,
    ticketId,
    actorUserId: ctx.session.user!.id!,
    role: ctx.session.role!,
    note: String(formData.get("note") ?? "") || null,
  });
  if (!result.ok) return { error: await actionResultError(result) };
  revalidatePath(`/app/tickets/${ticketId}`);
  revalidatePath("/app/tickets");
  return { ok: true };
}

export async function assignTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const ctx = await sessionContext();
  if (!ctx) return { error: await actionError("accessRequired") };
  const ticketId = String(formData.get("ticketId") ?? "");
  const priorityRaw = String(formData.get("priority") ?? "");
  const priority = Object.values(TicketPriority).includes(
    priorityRaw as TicketPriority,
  )
    ? (priorityRaw as TicketPriority)
    : undefined;

  const result = await assignTicket({
    tenantId: ctx.session.tenantId!,
    ticketId,
    actorUserId: ctx.session.user!.id!,
    role: ctx.session.role!,
    vendorId: String(formData.get("vendorId") ?? ""),
    priority,
    note: String(formData.get("note") ?? "") || null,
  });
  if (!result.ok) return { error: await actionResultError(result) };
  revalidatePath(`/app/tickets/${ticketId}`);
  revalidatePath("/app/tickets");
  return { ok: true };
}

export async function cancelTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const ctx = await sessionContext();
  if (!ctx) return { error: await actionError("accessRequired") };
  const ticketId = String(formData.get("ticketId") ?? "");
  const result = await cancelTicket({
    tenantId: ctx.session.tenantId!,
    ticketId,
    actorUserId: ctx.session.user!.id!,
    role: ctx.session.role!,
    reason: String(formData.get("reason") ?? ""),
  });
  if (!result.ok) return { error: await actionResultError(result) };
  revalidatePath(`/app/tickets/${ticketId}`);
  revalidatePath("/app/tickets");
  return { ok: true };
}
