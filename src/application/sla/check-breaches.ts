import { emitTicketNotification } from "@/application/notifications/emit";
import { TicketEventType } from "@/domain/ticket/event-types";
import { OPEN_TICKET_STATUSES } from "@/domain/ticket/status";
import { prisma } from "@/infrastructure/db/prisma";
import { appendTicketEvent } from "@/infrastructure/db/ticket-event-repository";
import { kickEmailOutboxDispatch } from "@/infrastructure/email/outbox";

/**
 * Marca breach idempotente: stamp + event + notify/outbox nella stessa TX (R1.4).
 */
export async function checkSlaBreaches(now = new Date()): Promise<{
  breached: number;
}> {
  const due = await prisma.ticket.findMany({
    where: {
      deletedAt: null,
      slaBreachedAt: null,
      slaDueAt: { lt: now },
      status: { in: [...OPEN_TICKET_STATUSES] },
    },
    include: { store: true, vendor: true },
    take: 100,
  });

  let breached = 0;
  let queuedMail = false;
  for (const ticket of due) {
    const did = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.updateMany({
        where: {
          id: ticket.id,
          tenantId: ticket.tenantId,
          slaBreachedAt: null,
          slaDueAt: { lt: now },
        },
        data: { slaBreachedAt: now },
      });
      if (updated.count === 0) return false;

      await appendTicketEvent(
        {
          tenantId: ticket.tenantId,
          ticketId: ticket.id,
          actorUserId: null,
          type: TicketEventType.slaBreached,
          fromStatus: ticket.status,
          toStatus: ticket.status,
          meta: { slaDueAt: ticket.slaDueAt?.toISOString() },
        },
        tx,
      );

      const fresh = await tx.ticket.findFirstOrThrow({
        where: { id: ticket.id },
        include: { store: true, vendor: true },
      });

      await emitTicketNotification({
        kind: "breached",
        tenantId: ticket.tenantId,
        ticket: fresh,
        actorUserId: "system",
        db: tx,
        skipKick: true,
      });
      return true;
    });
    if (did) {
      breached += 1;
      queuedMail = true;
    }
  }

  if (queuedMail) await kickEmailOutboxDispatch();
  return { breached };
}
