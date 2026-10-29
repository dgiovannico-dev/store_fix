import { TicketStatus } from "@prisma/client";
import { emitTicketNotification } from "@/application/notifications/emit";
import { TicketEventType } from "@/domain/ticket/event-types";
import { prisma } from "@/infrastructure/db/prisma";
import { appendTicketEvent } from "@/infrastructure/db/ticket-event-repository";

const OPEN_FOR_SLA: TicketStatus[] = [
  TicketStatus.open,
  TicketStatus.triaged,
  TicketStatus.assigned,
  TicketStatus.in_progress,
  TicketStatus.waiting_parts,
];

/**
 * Marca breach idempotente: `WHERE slaBreachedAt IS NULL` (T3.10 / US-E05-02).
 */
export async function checkSlaBreaches(now = new Date()): Promise<{
  breached: number;
}> {
  const due = await prisma.ticket.findMany({
    where: {
      deletedAt: null,
      slaBreachedAt: null,
      slaDueAt: { lt: now },
      status: { in: OPEN_FOR_SLA },
    },
    include: { store: true, vendor: true },
    take: 100,
  });

  let breached = 0;
  for (const ticket of due) {
    const updated = await prisma.ticket.updateMany({
      where: {
        id: ticket.id,
        tenantId: ticket.tenantId,
        slaBreachedAt: null,
        slaDueAt: { lt: now },
      },
      data: { slaBreachedAt: now },
    });
    if (updated.count === 0) continue;
    breached += 1;

    await appendTicketEvent({
      tenantId: ticket.tenantId,
      ticketId: ticket.id,
      actorUserId: null,
      type: TicketEventType.slaBreached,
      fromStatus: ticket.status,
      toStatus: ticket.status,
      meta: { slaDueAt: ticket.slaDueAt?.toISOString() },
    });

    const fresh = await prisma.ticket.findFirstOrThrow({
      where: { id: ticket.id },
      include: { store: true, vendor: true },
    });

    await emitTicketNotification({
      kind: "breached",
      tenantId: ticket.tenantId,
      ticket: fresh,
      actorUserId: "system",
    }).catch((e) => console.error("[sla.breach] notify", e));
  }

  return { breached };
}
