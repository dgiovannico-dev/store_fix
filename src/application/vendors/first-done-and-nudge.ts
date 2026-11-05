import { Role, TicketStatus } from "@prisma/client";
import { enqueueEmail } from "@/infrastructure/email/outbox";
import { prisma } from "@/infrastructure/db/prisma";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { appBaseUrl } from "@/lib/app-urls";

const NUDGE_AFTER_MS = 48 * 60 * 60 * 1000;

/** F9-03 — notify HQ the first time a vendor completes work in-portal. */
export async function notifyVendorFirstDone(input: {
  tenantId: string;
  vendorId: string;
  ticketId: string;
  vendorName: string;
}): Promise<void> {
  const prior = await prisma.ticket.count({
    where: {
      tenantId: input.tenantId,
      vendorId: input.vendorId,
      deletedAt: null,
      id: { not: input.ticketId },
      status: { in: [TicketStatus.done, TicketStatus.verified] },
    },
  });
  if (prior > 0) return;

  const hq = await prisma.membership.findMany({
    where: {
      tenantId: input.tenantId,
      deletedAt: null,
      role: { in: [Role.owner, Role.admin_hq, Role.ops_coordinator] },
    },
    select: { userId: true },
  });
  if (hq.length === 0) return;

  await prisma.notification.createMany({
    data: hq.map((m) => ({
      tenantId: input.tenantId,
      userId: m.userId,
      type: "vendor.first_done",
      ticketId: input.ticketId,
      payload: {
        kind: "vendor_first_done",
        vendorId: input.vendorId,
        vendorName: input.vendorName,
      },
    })),
  });
}

/** F9-03 — stall nudge for assigned/in_progress tickets older than 48h. */
export async function runVendorFirstDoneNudges(): Promise<{
  nudged: number;
}> {
  const cutoff = new Date(Date.now() - NUDGE_AFTER_MS);
  const candidates = await prisma.ticket.findMany({
    where: {
      deletedAt: null,
      status: { in: [TicketStatus.assigned, TicketStatus.in_progress] },
      vendorId: { not: null },
      OR: [
        { assignedAt: { lte: cutoff } },
        { assignedAt: null, openedAt: { lte: cutoff } },
      ],
    },
    take: 50,
    include: {
      vendor: { select: { id: true, name: true, email: true } },
      store: { select: { name: true } },
    },
  });

  let nudged = 0;
  for (const ticket of candidates) {
    if (!ticket.vendor?.email) continue;
    const existing = await prisma.ticketVendorNudge.findUnique({
      where: { ticketId: ticket.id },
    });
    if (existing) continue;

    const prefs = await getTenantI18nPrefs(ticket.tenantId);
    await enqueueEmail({
      to: ticket.vendor.email,
      tenantId: ticket.tenantId,
      template: "vendor_nudge",
      locale: prefs.locale,
      vars: {
        ticketId: ticket.id,
        storeName: ticket.store.name,
        vendorName: ticket.vendor.name,
        summary: ticket.description.slice(0, 120),
        acceptUrl: `${appBaseUrl()}/vendor/inbox`,
      },
      idempotencyKey: `vendor-nudge:${ticket.id}`,
    });
    await prisma.ticketVendorNudge.create({
      data: { tenantId: ticket.tenantId, ticketId: ticket.id },
    });
    nudged += 1;
  }
  return { nudged };
}
