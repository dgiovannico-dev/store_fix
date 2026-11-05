/**
 * AssistTools — read-only, tenant-scoped SELECT helpers for tool-agent / MCP.
 * Never mutate tickets, SLA, costs, or awards.
 */

import { TicketStatus } from "@prisma/client";
import { findSimilarTickets } from "@/application/ai/similar-tickets";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export type AssistToolName =
  | "similar_tickets"
  | "ticket_summary_readonly"
  | "asset_history"
  | "vendor_scorecard_snippet";

export async function toolSimilarTickets(input: {
  tenantId: string;
  userId: string;
  ticketId: string;
  limit?: number;
  signal?: AbortSignal;
}) {
  return findSimilarTickets(input);
}

export async function toolTicketSummaryReadonly(input: {
  tenantId: string;
  ticketId: string;
}) {
  requireTenantId(input.tenantId);
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
    select: {
      id: true,
      category: true,
      priority: true,
      status: true,
      description: true,
      slaDueAt: true,
      slaBreachedAt: true,
      vendorId: true,
      assetId: true,
      store: { select: { name: true, city: true } },
      vendor: { select: { name: true } },
      completionReport: true,
    },
  });
  if (!ticket) return null;
  return {
    ticketId: ticket.id,
    storeCode: ticket.store.city ?? ticket.store.name,
    storeName: ticket.store.name,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    description: ticket.description.slice(0, 800),
    completionReport: ticket.completionReport?.slice(0, 400) ?? null,
    slaDueAt: ticket.slaDueAt?.toISOString() ?? null,
    slaBreachedAt: ticket.slaBreachedAt?.toISOString() ?? null,
    vendorName: ticket.vendor?.name ?? null,
    assetId: ticket.assetId,
  };
}

export async function toolAssetHistory(input: {
  tenantId: string;
  assetId: string;
  excludeTicketId?: string;
  limit?: number;
}) {
  requireTenantId(input.tenantId);
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 15);
  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId: input.tenantId,
      assetId: input.assetId,
      deletedAt: null,
      ...(input.excludeTicketId
        ? { id: { not: input.excludeTicketId } }
        : {}),
    },
    orderBy: { openedAt: "desc" },
    take: limit,
    select: {
      id: true,
      category: true,
      status: true,
      openedAt: true,
      verifiedAt: true,
      description: true,
    },
  });
  return tickets.map((t) => ({
    ticketId: t.id,
    category: t.category,
    status: t.status,
    openedAt: t.openedAt.toISOString(),
    verifiedAt: t.verifiedAt?.toISOString() ?? null,
    snippet: t.description.slice(0, 120),
  }));
}

export async function toolVendorScorecardSnippet(input: {
  tenantId: string;
  vendorId: string;
  rangeDays?: number;
}) {
  requireTenantId(input.tenantId);
  const rangeDays = input.rangeDays ?? 30;
  const from = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);

  const vendor = await prisma.vendor.findFirst({
    where: {
      id: input.vendorId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
    select: { id: true, name: true },
  });
  if (!vendor) return null;

  const [openCount, verifiedRecent, breached] = await Promise.all([
    prisma.ticket.count({
      where: {
        tenantId: input.tenantId,
        vendorId: vendor.id,
        deletedAt: null,
        status: {
          notIn: [TicketStatus.verified, TicketStatus.cancelled],
        },
      },
    }),
    prisma.ticket.count({
      where: {
        tenantId: input.tenantId,
        vendorId: vendor.id,
        deletedAt: null,
        verifiedAt: { gte: from },
      },
    }),
    prisma.ticket.count({
      where: {
        tenantId: input.tenantId,
        vendorId: vendor.id,
        deletedAt: null,
        slaBreachedAt: { not: null },
        openedAt: { gte: from },
      },
    }),
  ]);

  return {
    vendorId: vendor.id,
    vendorName: vendor.name,
    rangeDays,
    openTickets: openCount,
    verifiedInRange: verifiedRecent,
    breachedOpenedInRange: breached,
  };
}
