import { TicketStatus } from "@prisma/client";
import { OPEN_TICKET_STATUSES } from "@/domain/ticket/status";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export type WallboardTicketRow = {
  id: string;
  storeName: string;
  category: string;
  priority: string;
  status: TicketStatus;
  breached: boolean;
  openedAt: string;
};

/** CQRS read — wallboard TV (R3.1). */
export async function listWallboardTickets(
  tenantId: string,
): Promise<WallboardTicketRow[]> {
  requireTenantId(tenantId);
  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId,
      deletedAt: null,
      OR: [
        { status: { in: [...OPEN_TICKET_STATUSES] } },
        {
          slaBreachedAt: { not: null },
          status: { not: TicketStatus.verified },
        },
      ],
    },
    include: { store: { select: { name: true } } },
    orderBy: [{ slaBreachedAt: "desc" }, { openedAt: "asc" }],
    take: 80,
  });
  return tickets.map((t) => ({
    id: t.id,
    storeName: t.store.name,
    category: t.category,
    priority: t.priority,
    status: t.status,
    breached: Boolean(t.slaBreachedAt),
    openedAt: t.openedAt.toISOString(),
  }));
}
