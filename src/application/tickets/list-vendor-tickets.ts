import { Role, TicketStatus, type Membership } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export type VendorInboxTab = "todo" | "progress" | "closed";

const TAB_STATUS: Record<VendorInboxTab, TicketStatus[]> = {
  todo: [TicketStatus.assigned],
  progress: [TicketStatus.in_progress, TicketStatus.waiting_parts],
  closed: [TicketStatus.done, TicketStatus.verified],
};

export async function listVendorTickets(input: {
  tenantId: string;
  role: Role;
  membership: Pick<Membership, "role" | "vendorId" | "deletedAt">;
  tab: VendorInboxTab;
  take?: number;
}) {
  requireTenantId(input.tenantId);
  if (input.role !== Role.vendor || !input.membership.vendorId) {
    return [];
  }

  return prisma.ticket.findMany({
    where: {
      tenantId: input.tenantId,
      vendorId: input.membership.vendorId,
      deletedAt: null,
      status: { in: TAB_STATUS[input.tab] },
    },
    orderBy: [{ slaDueAt: "asc" }, { openedAt: "desc" }],
    take: input.take ?? 50,
    include: {
      store: { select: { id: true, name: true, city: true, address: true } },
    },
  });
}
