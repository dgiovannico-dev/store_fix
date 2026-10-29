import {
  Role,
  TicketPriority,
  TicketStatus,
  type Membership,
  type Prisma,
} from "@prisma/client";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

const HQ: ReadonlySet<Role> = new Set([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
  Role.viewer_finance,
]);

export type TicketListFilters = {
  status?: TicketStatus | "";
  priority?: TicketPriority | "";
  storeId?: string;
  vendorId?: string;
  slaRisk?: "overdue" | "due_soon" | "";
};

export async function listTicketsForMembership(input: {
  tenantId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt" | "vendorId">;
  filters?: TicketListFilters;
  take?: number;
}) {
  requireTenantId(input.tenantId);
  const take = input.take ?? 50;
  const f = input.filters ?? {};

  const where: Prisma.TicketWhereInput = {
    tenantId: input.tenantId,
    deletedAt: null,
  };

  if (f.status) where.status = f.status;
  if (f.priority) where.priority = f.priority;
  if (f.storeId) where.storeId = f.storeId;
  if (f.vendorId) where.vendorId = f.vendorId;

  if (f.slaRisk === "overdue") {
    where.slaDueAt = { lt: new Date() };
    where.status = {
      notIn: [TicketStatus.verified, TicketStatus.cancelled],
    };
  } else if (f.slaRisk === "due_soon") {
    const in4h = new Date(Date.now() + 4 * 60 * 60 * 1000);
    where.slaDueAt = { gte: new Date(), lte: in4h };
    where.status = {
      notIn: [TicketStatus.verified, TicketStatus.cancelled],
    };
  }

  if (input.role === Role.vendor && input.membership.vendorId) {
    where.vendorId = input.membership.vendorId;
  } else if (!HQ.has(input.role)) {
    const ids = input.membership.storeIds;
    if (ids.length === 0) return [];
    where.storeId = { in: ids };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { openedAt: "desc" },
    take,
    include: {
      store: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
    },
  });

  return tickets.filter((t) => canAccessStore(input.membership, t.storeId));
}
