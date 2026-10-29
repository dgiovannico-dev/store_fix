import {
  Role,
  TicketPriority,
  TicketStatus,
  type Prisma,
} from "@prisma/client";
import { z } from "zod";
import { emitTicketNotification } from "@/application/notifications/emit";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCan, ForbiddenError } from "@/domain/rbac/guards";
import {
  assertTransition,
  IllegalTransitionError,
} from "@/domain/ticket/fsm";
import {
  assertTicketMutable,
  TicketImmutableError,
} from "@/domain/ticket/mutability";
import { statusTimestampData } from "@/domain/ticket/status-timestamps";
import { prisma } from "@/infrastructure/db/prisma";
import { appendTicketEvent } from "@/infrastructure/db/ticket-event-repository";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

async function loadTicket(tenantId: string, ticketId: string) {
  requireTenantId(tenantId);
  return prisma.ticket.findFirst({
    where: { id: ticketId, tenantId, deletedAt: null },
    include: {
      store: true,
      asset: { include: { preferredVendor: true } },
      vendor: true,
    },
  });
}

function failTransition(e: unknown): {
  ok: false;
  message: string;
  code?: string;
  params?: Record<string, string>;
} {
  if (e instanceof TicketImmutableError) {
    return { ok: false, message: e.message, code: e.code };
  }
  if (e instanceof IllegalTransitionError) {
    return {
      ok: false,
      message: e.message,
      code: e.code,
      params:
        e.code === "illegalTransition"
          ? { from: e.from, to: e.to, role: e.role }
          : undefined,
    };
  }
  if (e instanceof ForbiddenError) {
    return { ok: false, message: e.message, code: e.code };
  }
  throw e;
}

/**
 * Servizio unico di transition (T2.22): FSM + timestamp + TicketEvent.
 */
export async function transitionTicket(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  to: TicketStatus;
  meta?: Prisma.InputJsonValue;
  eventType: string;
  vendorId?: string | null;
  priority?: TicketPriority;
  cancelReason?: string | null;
  rejectReason?: string | null;
  actualCost?: number | null;
  estimatedCost?: number | null;
  completionReport?: string | null;
  extraEvents?: Array<{
    type: string;
    meta?: Prisma.InputJsonValue;
  }>;
}) {
  const ticket = await loadTicket(input.tenantId, input.ticketId);
  if (!ticket) {
    return {
      ok: false as const,
      message: "Ticket non trovato",
      code: "ticketNotFound",
    };
  }

  try {
    assertTicketMutable(ticket.status);
    assertTransition(ticket.status, input.to, input.role);
  } catch (e) {
    return failTransition(e);
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        status: input.to,
        ...statusTimestampData(input.to, now),
        ...(input.vendorId !== undefined ? { vendorId: input.vendorId } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.cancelReason !== undefined
          ? { cancelReason: input.cancelReason }
          : {}),
        ...(input.rejectReason !== undefined
          ? { rejectReason: input.rejectReason }
          : {}),
        ...(input.actualCost !== undefined
          ? { actualCost: input.actualCost }
          : {}),
        ...(input.estimatedCost !== undefined
          ? { estimatedCost: input.estimatedCost }
          : {}),
        ...(input.completionReport !== undefined
          ? { completionReport: input.completionReport }
          : {}),
      },
      include: { store: true, vendor: true, asset: true },
    });

    await appendTicketEvent(
      {
        tenantId: input.tenantId,
        ticketId: ticket.id,
        actorUserId: input.actorUserId,
        type: input.eventType,
        fromStatus: ticket.status,
        toStatus: input.to,
        meta: input.meta,
      },
      tx,
    );

    for (const ev of input.extraEvents ?? []) {
      await appendTicketEvent(
        {
          tenantId: input.tenantId,
          ticketId: ticket.id,
          actorUserId: input.actorUserId,
          type: ev.type,
          fromStatus: ticket.status,
          toStatus: input.to,
          meta: ev.meta,
        },
        tx,
      );
    }

    return row;
  });

  return { ok: true as const, ticket: updated, previous: ticket };
}

export const triageSchema = z.object({
  note: z.string().trim().max(2000).optional().nullable(),
});

export async function triageTicket(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  note?: string | null;
}) {
  try {
    assertCan(input.role, RbacAction.triageTicket);
  } catch (e) {
    return failTransition(e);
  }

  return transitionTicket({
    tenantId: input.tenantId,
    ticketId: input.ticketId,
    actorUserId: input.actorUserId,
    role: input.role,
    to: TicketStatus.triaged,
    eventType: "ticket.triaged",
    meta: input.note ? { noteInternal: input.note } : undefined,
  });
}

export const assignSchema = z.object({
  vendorId: z.string().min(1),
  priority: z.nativeEnum(TicketPriority).optional(),
  note: z.string().trim().max(2000).optional().nullable(),
});

export async function assignTicket(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  vendorId: string;
  priority?: TicketPriority;
  note?: string | null;
}) {
  try {
    assertCan(input.role, RbacAction.triageTicket);
  } catch (e) {
    return failTransition(e);
  }

  requireTenantId(input.tenantId);
  const vendor = await prisma.vendor.findFirst({
    where: {
      id: input.vendorId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!vendor) {
    return {
      ok: false as const,
      message: "Fornitore non valido",
      code: "vendorInvalid",
    };
  }

  const result = await transitionTicket({
    tenantId: input.tenantId,
    ticketId: input.ticketId,
    actorUserId: input.actorUserId,
    role: input.role,
    to: TicketStatus.assigned,
    vendorId: vendor.id,
    priority: input.priority,
    eventType: "ticket.assigned",
    meta: {
      vendorId: vendor.id,
      vendorName: vendor.name,
      ...(input.note ? { noteInternal: input.note } : {}),
    },
  });

  if (result.ok) {
    await emitTicketNotification({
      kind: "assigned",
      tenantId: input.tenantId,
      ticket: result.ticket,
      actorUserId: input.actorUserId,
    }).catch((e) => console.error("[assign] notify", e));
  }

  return result;
}

export const cancelSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export async function cancelTicket(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  reason: string;
}) {
  try {
    assertCan(input.role, RbacAction.cancelTicket);
  } catch (e) {
    return failTransition(e);
  }

  const parsed = cancelSchema.safeParse({ reason: input.reason });
  if (!parsed.success) {
    return { ok: false as const, message: "Motivo obbligatorio" };
  }

  const result = await transitionTicket({
    tenantId: input.tenantId,
    ticketId: input.ticketId,
    actorUserId: input.actorUserId,
    role: input.role,
    to: TicketStatus.cancelled,
    cancelReason: parsed.data.reason,
    eventType: "ticket.cancelled",
    meta: { reason: parsed.data.reason },
  });

  if (result.ok) {
    await emitTicketNotification({
      kind: "cancelled",
      tenantId: input.tenantId,
      ticket: result.ticket,
      actorUserId: input.actorUserId,
    }).catch((e) => console.error("[cancel] notify", e));
  }

  return result;
}

/** Hint preferred vendor da asset (non auto-assign). */
export function preferredVendorHint(
  asset:
    | {
        preferredVendorId: string | null;
        preferredVendor?: { id: string; name: string } | null;
      }
    | null
    | undefined,
): { vendorId: string; vendorName: string } | null {
  if (!asset?.preferredVendorId) return null;
  return {
    vendorId: asset.preferredVendorId,
    vendorName: asset.preferredVendor?.name ?? asset.preferredVendorId,
  };
}
