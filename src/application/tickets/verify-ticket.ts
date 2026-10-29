import { Role, TicketStatus, type Membership } from "@prisma/client";
import { z } from "zod";
import { emitTicketNotification } from "@/application/notifications/emit";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCan, ForbiddenError } from "@/domain/rbac/guards";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { TicketEventType } from "@/domain/ticket/event-types";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";
import { transitionTicket } from "./transition-ticket";

export async function verifyTicket(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">;
}) {
  requireTenantId(input.tenantId);
  try {
    assertCan(input.role, RbacAction.verifyTicket);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, message: e.message, code: e.code };
    }
    throw e;
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket) return { ok: false as const, message: "Ticket non trovato" };
  if (!canAccessStore(input.membership, ticket.storeId)) {
    return { ok: false as const, message: "Ticket fuori scope store" };
  }
  if (ticket.status !== TicketStatus.done) {
    return {
      ok: false as const,
      message: "Verifica solo da stato done",
    };
  }

  const result = await transitionTicket({
    tenantId: input.tenantId,
    ticketId: ticket.id,
    actorUserId: input.actorUserId,
    role: input.role,
    to: TicketStatus.verified,
    eventType: TicketEventType.verified,
    rejectReason: null,
    meta: { source: "store_verify" },
  });

  if (result.ok) {
    await emitTicketNotification({
      kind: "verified",
      tenantId: input.tenantId,
      ticket: result.ticket,
      actorUserId: input.actorUserId,
    }).catch((e) => console.error("[verify] notify", e));
  }
  return result;
}

export const rejectSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
});

/** Reject → in_progress (S3 decision). */
export async function rejectTicket(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">;
  reason: string;
}) {
  requireTenantId(input.tenantId);
  try {
    assertCan(input.role, RbacAction.verifyTicket);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, message: e.message, code: e.code };
    }
    throw e;
  }

  const parsed = rejectSchema.safeParse({ reason: input.reason });
  if (!parsed.success) {
    return { ok: false as const, message: "Motivo rifiuto obbligatorio" };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket) return { ok: false as const, message: "Ticket non trovato" };
  if (!canAccessStore(input.membership, ticket.storeId)) {
    return { ok: false as const, message: "Ticket fuori scope store" };
  }
  if (ticket.status !== TicketStatus.done) {
    return {
      ok: false as const,
      message: "Rifiuto solo da stato done",
    };
  }

  const result = await transitionTicket({
    tenantId: input.tenantId,
    ticketId: ticket.id,
    actorUserId: input.actorUserId,
    role: input.role,
    to: TicketStatus.in_progress,
    eventType: TicketEventType.rejected,
    rejectReason: parsed.data.reason,
    meta: { reason: parsed.data.reason, source: "store_reject" },
  });

  if (result.ok) {
    await emitTicketNotification({
      kind: "rejected",
      tenantId: input.tenantId,
      ticket: result.ticket,
      actorUserId: input.actorUserId,
    }).catch((e) => console.error("[reject] notify", e));
  }
  return result;
}
