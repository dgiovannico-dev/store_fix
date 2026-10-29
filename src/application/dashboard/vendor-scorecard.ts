import { Role, TicketStatus } from "@prisma/client";
import {
  buildSingleVendorScorecard,
  buildVendorScorecardRows,
  type VendorScorecardRow,
} from "@/domain/dashboard/vendor-scorecard";
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

export type VendorScorecardOverview = {
  rangeDays: number;
  from: Date;
  rows: VendorScorecardRow[];
};

/**
 * Scorecard fornitori HQ (F2-03) — read-model su Ticket, stesso gate di dashboard HQ.
 */
export async function listVendorScorecards(input: {
  tenantId: string;
  role: Role;
  rangeDays?: number;
  now?: Date;
}): Promise<VendorScorecardOverview> {
  requireTenantId(input.tenantId);
  if (!can(input.role, RbacAction.dashboardHq)) {
    throw new ForbiddenError(undefined, "scorecardForbidden");
  }

  const rangeDays = input.rangeDays ?? 30;
  const now = input.now ?? new Date();
  const from = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId: input.tenantId,
      deletedAt: null,
      vendorId: { not: null },
      OR: [
        { status: { in: OPEN_STATUSES } },
        { verifiedAt: { gte: from } },
        { doneAt: { gte: from } },
      ],
    },
    select: {
      vendorId: true,
      status: true,
      openedAt: true,
      verifiedAt: true,
      doneAt: true,
      slaDueAt: true,
      slaBreachedAt: true,
      actualCost: true,
      vendor: { select: { id: true, name: true, deletedAt: true } },
    },
  });

  const slices = tickets
    .filter((tk) => tk.vendorId && tk.vendor && !tk.vendor.deletedAt)
    .map((tk) => ({
      vendorId: tk.vendorId!,
      vendorName: tk.vendor!.name,
      status: tk.status,
      openedAt: tk.openedAt,
      verifiedAt: tk.verifiedAt,
      doneAt: tk.doneAt,
      slaDueAt: tk.slaDueAt,
      slaBreachedAt: tk.slaBreachedAt,
      actualCost: tk.actualCost,
    }));

  return {
    rangeDays,
    from,
    rows: buildVendorScorecardRows({ tickets: slices, from }),
  };
}

export async function getVendorScorecard(input: {
  tenantId: string;
  role: Role;
  vendorId: string;
  rangeDays?: number;
  now?: Date;
}): Promise<VendorScorecardRow | null> {
  const overview = await listVendorScorecards(input);
  const fromList = buildSingleVendorScorecard(input.vendorId, overview.rows);
  if (fromList) return fromList;

  const vendor = await prisma.vendor.findFirst({
    where: {
      id: input.vendorId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!vendor) return null;

  return {
    vendorId: vendor.id,
    vendorName: vendor.name,
    closedCount: 0,
    avgResolutionDays: null,
    slaHitRate: null,
    costsTotal: 0,
    openAssignedCount: 0,
  };
}
