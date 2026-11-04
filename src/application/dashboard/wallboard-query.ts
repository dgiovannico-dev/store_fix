import { Prisma, TicketStatus } from "@prisma/client";
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

export const WALLBOARD_PAGE_SIZE = 24;
export const WALLBOARD_MAX_PAGE_SIZE = 48;

function wallboardWhere(tenantId: string): Prisma.TicketWhereInput {
  return {
    tenantId,
    deletedAt: null,
    OR: [
      { status: { in: [...OPEN_TICKET_STATUSES] } },
      {
        slaBreachedAt: { not: null },
        status: { not: TicketStatus.verified },
      },
    ],
  };
}

export type WallboardPage = {
  items: WallboardTicketRow[];
  total: number;
  nextSkip: number | null;
};

/** CQRS read — wallboard TV (R3.1), paginated for large card sets. */
export async function listWallboardTicketsPage(
  tenantId: string,
  opts: { skip?: number; take?: number } = {},
): Promise<WallboardPage> {
  requireTenantId(tenantId);
  const take = Math.min(
    Math.max(opts.take ?? WALLBOARD_PAGE_SIZE, 1),
    WALLBOARD_MAX_PAGE_SIZE,
  );
  const skip = Math.max(opts.skip ?? 0, 0);
  const where = wallboardWhere(tenantId);

  const [total, tickets] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      include: { store: { select: { name: true } } },
      orderBy: [{ slaBreachedAt: "desc" }, { openedAt: "asc" }],
      take,
      skip,
    }),
  ]);

  const items: WallboardTicketRow[] = tickets.map((t) => ({
    id: t.id,
    storeName: t.store.name,
    category: t.category,
    priority: t.priority,
    status: t.status,
    breached: Boolean(t.slaBreachedAt),
    openedAt: t.openedAt.toISOString(),
  }));
  const nextSkip = skip + items.length < total ? skip + items.length : null;
  return { items, total, nextSkip };
}

/** First page helper (SSR / characterization). */
export async function listWallboardTickets(
  tenantId: string,
): Promise<WallboardTicketRow[]> {
  const page = await listWallboardTicketsPage(tenantId, {
    take: WALLBOARD_PAGE_SIZE,
    skip: 0,
  });
  return page.items;
}
