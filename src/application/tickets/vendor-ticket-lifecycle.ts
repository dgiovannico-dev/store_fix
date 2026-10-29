import {
  Role,
  TicketStatus,
  type Membership,
} from "@prisma/client";
import { z } from "zod";
import { emitTicketNotification } from "@/application/notifications/emit";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCan, ForbiddenError } from "@/domain/rbac/guards";
import {
  assertCompleteWorkReady,
  CompleteWorkError,
} from "@/domain/ticket/complete-work";
import { TicketEventType } from "@/domain/ticket/event-types";
import { blocksCompleteWork } from "@/domain/ticket/quote";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";
import { transitionTicket } from "./transition-ticket";
import { assertVendorTicketScope } from "./vendor-scope";

const VENDOR_STATUS = new Set<TicketStatus>([
  TicketStatus.in_progress,
  TicketStatus.waiting_parts,
]);

export async function transitionVendorStatus(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  membership: Pick<Membership, "role" | "vendorId" | "deletedAt" | "storeIds">;
  to: TicketStatus;
}) {
  requireTenantId(input.tenantId);
  try {
    assertCan(input.role, RbacAction.vendorStatus);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, message: e.message, code: e.code };
    }
    throw e;
  }

  if (!VENDOR_STATUS.has(input.to) && input.to !== TicketStatus.in_progress) {
    return { ok: false as const, message: "Stato vendor non valido" };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket) return { ok: false as const, message: "Ticket non trovato" };

  try {
    assertVendorTicketScope(input.membership, ticket, input.role);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, message: e.message, code: e.code };
    }
    throw e;
  }

  return transitionTicket({
    tenantId: input.tenantId,
    ticketId: input.ticketId,
    actorUserId: input.actorUserId,
    role: input.role,
    to: input.to,
    eventType: TicketEventType.statusChanged,
    meta: { source: "vendor" },
  });
}

export const completeWorkSchema = z.object({
  actualCost: z.coerce.number().positive(),
  estimatedCost: z.coerce.number().nonnegative().optional().nullable(),
  completionReport: z.string().trim().min(5).max(4000),
});

export async function completeVendorWork(input: {
  tenantId: string;
  ticketId: string;
  actorUserId: string;
  role: Role;
  membership: Pick<Membership, "role" | "vendorId" | "deletedAt" | "storeIds">;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  try {
    assertCan(input.role, RbacAction.vendorStatus);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, message: e.message, code: e.code };
    }
    throw e;
  }

  const parsed = completeWorkSchema.safeParse(input.data);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Dati chiusura non validi (costo e report obbligatori)",
    };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
    include: {
      attachments: { where: { deletedAt: null } },
      store: true,
      vendor: true,
    },
  });
  if (!ticket) return { ok: false as const, message: "Ticket non trovato" };

  try {
    assertVendorTicketScope(input.membership, ticket, input.role);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false as const, message: e.message, code: e.code };
    }
    throw e;
  }

  if (
    ticket.status !== TicketStatus.in_progress &&
    ticket.status !== TicketStatus.waiting_parts &&
    ticket.status !== TicketStatus.assigned
  ) {
    return {
      ok: false as const,
      message: "Chiusura consentita solo da assigned / in_progress / waiting_parts",
    };
  }

  if (blocksCompleteWork(ticket.quoteStatus)) {
    return {
      ok: false as const,
      message:
        "Preventivo in attesa di accettazione: attendi lo store o aggiorna il preventivo",
    };
  }

  try {
    assertCompleteWorkReady({
      attachments: ticket.attachments,
      actualCost: parsed.data.actualCost,
      completionReport: parsed.data.completionReport,
    });
  } catch (e) {
    if (e instanceof CompleteWorkError) {
      return { ok: false as const, message: e.message };
    }
    throw e;
  }

  const result = await transitionTicket({
    tenantId: input.tenantId,
    ticketId: ticket.id,
    actorUserId: input.actorUserId,
    role: input.role,
    to: TicketStatus.done,
    eventType: TicketEventType.statusChanged,
    actualCost: parsed.data.actualCost,
    estimatedCost: parsed.data.estimatedCost ?? undefined,
    completionReport: parsed.data.completionReport,
    meta: {
      source: "vendor_complete",
      actualCost: parsed.data.actualCost,
      completionReport: parsed.data.completionReport,
    },
    extraEvents: [
      {
        type: TicketEventType.costSet,
        meta: {
          actualCost: parsed.data.actualCost,
          estimatedCost: parsed.data.estimatedCost ?? null,
        },
      },
    ],
  });

  if (result.ok) {
    await emitTicketNotification({
      kind: "done",
      tenantId: input.tenantId,
      ticket: result.ticket,
      actorUserId: input.actorUserId,
    }).catch((e) => console.error("[complete] notify", e));
  }

  return result;
}
