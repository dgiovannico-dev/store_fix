import { Role, TicketStatus, type Membership } from "@prisma/client";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { ForbiddenError } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

const OPEN_STATUSES: TicketStatus[] = [
  TicketStatus.open,
  TicketStatus.triaged,
  TicketStatus.assigned,
  TicketStatus.in_progress,
  TicketStatus.waiting_parts,
];

export type HqOverview = {
  rangeDays: number;
  from: Date;
  openCount: number;
  breachedCount: number;
  atRiskCount: number;
  /** Ore medie openedAt → verifiedAt su verified nel range */
  mttrHours: number | null;
  costsTotal: number;
  byStore: Array<{
    storeId: string;
    storeName: string;
    openCount: number;
    breachedCount: number;
    costs: number;
  }>;
};

/**
 * KPI HQ (US-E09-01).
 * A rischio: aperti con slaDueAt entro 20% del tempo totale opened→due (o &lt;4h fallback).
 */
export async function getHqOverview(input: {
  tenantId: string;
  role: Role;
  rangeDays?: number;
  now?: Date;
}): Promise<HqOverview> {
  requireTenantId(input.tenantId);
  if (!can(input.role, RbacAction.dashboardHq)) {
    throw new ForbiddenError("Dashboard non consentita", "dashboardForbidden");
  }

  const rangeDays = input.rangeDays ?? 30;
  const now = input.now ?? new Date();
  const from = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId: input.tenantId,
      deletedAt: null,
      OR: [
        { status: { in: OPEN_STATUSES } },
        { verifiedAt: { gte: from } },
        { doneAt: { gte: from } },
        { slaBreachedAt: { not: null } },
      ],
    },
    include: { store: { select: { id: true, name: true } } },
  });

  const open = tickets.filter((t) => OPEN_STATUSES.includes(t.status));
  const breached = open.filter((t) => t.slaBreachedAt != null);
  const atRisk = open.filter((t) => {
    if (t.slaBreachedAt || !t.slaDueAt) return false;
    const total = t.slaDueAt.getTime() - t.openedAt.getTime();
    const rem = t.slaDueAt.getTime() - now.getTime();
    if (total <= 0) return rem > 0 && rem < 4 * 60 * 60 * 1000;
    return rem > 0 && rem / total < 0.2;
  });

  const verified = tickets.filter(
    (t) =>
      t.status === TicketStatus.verified &&
      t.verifiedAt &&
      t.verifiedAt >= from,
  );
  let mttrHours: number | null = null;
  if (verified.length > 0) {
    const sumMs = verified.reduce((acc, t) => {
      return acc + (t.verifiedAt!.getTime() - t.openedAt.getTime());
    }, 0);
    mttrHours = sumMs / verified.length / (1000 * 60 * 60);
  }

  const costTickets = tickets.filter(
    (t) =>
      t.actualCost != null &&
      (t.status === TicketStatus.verified || t.status === TicketStatus.done) &&
      (t.verifiedAt ?? t.doneAt ?? t.updatedAt) >= from,
  );
  const costsTotal = costTickets.reduce(
    (acc, t) => acc + Number(t.actualCost),
    0,
  );

  const storeMap = new Map<
    string,
    {
      storeId: string;
      storeName: string;
      openCount: number;
      breachedCount: number;
      costs: number;
    }
  >();
  for (const t of tickets) {
    const cur = storeMap.get(t.storeId) ?? {
      storeId: t.storeId,
      storeName: t.store.name,
      openCount: 0,
      breachedCount: 0,
      costs: 0,
    };
    if (OPEN_STATUSES.includes(t.status)) {
      cur.openCount += 1;
      if (t.slaBreachedAt) cur.breachedCount += 1;
    }
    if (
      t.actualCost != null &&
      (t.status === TicketStatus.done || t.status === TicketStatus.verified)
    ) {
      const when = t.verifiedAt ?? t.doneAt ?? t.updatedAt;
      if (when >= from) cur.costs += Number(t.actualCost);
    }
    storeMap.set(t.storeId, cur);
  }

  return {
    rangeDays,
    from,
    openCount: open.length,
    breachedCount: breached.length,
    atRiskCount: atRisk.length,
    mttrHours,
    costsTotal,
    byStore: [...storeMap.values()].sort((a, b) =>
      a.storeName.localeCompare(b.storeName, "it"),
    ),
  };
}

export async function listClosedTicketsForFinance(input: {
  tenantId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">;
  take?: number;
}) {
  requireTenantId(input.tenantId);
  if (!can(input.role, RbacAction.dashboardHq)) {
    throw new ForbiddenError();
  }
  return prisma.ticket.findMany({
    where: {
      tenantId: input.tenantId,
      deletedAt: null,
      status: { in: [TicketStatus.done, TicketStatus.verified] },
    },
    orderBy: { updatedAt: "desc" },
    take: input.take ?? 50,
    include: {
      store: { select: { name: true } },
      vendor: { select: { name: true } },
    },
  });
}
