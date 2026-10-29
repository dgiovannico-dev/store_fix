import type { Prisma, TicketStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { requireTenantId } from "./tenant-scope";

export type AppendTicketEventInput = {
  tenantId: string;
  ticketId: string;
  actorUserId?: string | null;
  type: string;
  fromStatus?: TicketStatus | null;
  toStatus?: TicketStatus | null;
  meta?: Prisma.InputJsonValue;
};

/**
 * Append-only TicketEvent (T2.4 / US-E10-01).
 * Nessun update/delete esposto.
 */
export async function appendTicketEvent(
  input: AppendTicketEventInput,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  requireTenantId(input.tenantId);
  return tx.ticketEvent.create({
    data: {
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      actorUserId: input.actorUserId ?? null,
      type: input.type,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      meta: input.meta,
    },
  });
}

export async function listTicketEvents(tenantId: string, ticketId: string) {
  requireTenantId(tenantId);
  return prisma.ticketEvent.findMany({
    where: { tenantId, ticketId },
    orderBy: { createdAt: "asc" },
  });
}
