import { TicketStatus } from "@prisma/client";
import { TicketEventType } from "@/domain/ticket/event-types";
import { prisma } from "@/infrastructure/db/prisma";
import { appendTicketEvent } from "@/infrastructure/db/ticket-event-repository";

/** Default prodotto US-E12-01: 24 mesi dopo `verified`. */
export const VERIFIED_RETENTION_MONTHS = 24;

const BATCH = 100;

export function retentionCutoff(
  now = new Date(),
  months = VERIFIED_RETENTION_MONTHS,
): Date {
  const d = new Date(now.getTime());
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

export type PurgeExpiredResult = {
  cutoff: string;
  dryRun: boolean;
  candidates: number;
  purged: number;
  attachments: number;
};

/**
 * Soft-delete ticket `verified` oltre retention + allegati correlati.
 * Nessun hard-delete DB/SeaweedFS (GC oggetti = follow-up ops).
 * Idempotente: `deletedAt IS NULL` sul candidate set.
 */
export async function purgeExpiredVerifiedTickets(opts?: {
  now?: Date;
  months?: number;
  dryRun?: boolean;
  take?: number;
}): Promise<PurgeExpiredResult> {
  const now = opts?.now ?? new Date();
  const months = opts?.months ?? VERIFIED_RETENTION_MONTHS;
  const dryRun =
    opts?.dryRun === true || process.env.GDPR_PURGE_DRY_RUN === "true";
  const take = opts?.take ?? BATCH;
  const cutoff = retentionCutoff(now, months);

  const candidates = await prisma.ticket.findMany({
    where: {
      deletedAt: null,
      status: TicketStatus.verified,
      verifiedAt: { not: null, lt: cutoff },
    },
    select: { id: true, tenantId: true, status: true },
    take,
    orderBy: { verifiedAt: "asc" },
  });

  if (dryRun || candidates.length === 0) {
    return {
      cutoff: cutoff.toISOString(),
      dryRun,
      candidates: candidates.length,
      purged: 0,
      attachments: 0,
    };
  }

  let purged = 0;
  let attachments = 0;

  for (const ticket of candidates) {
    const updated = await prisma.ticket.updateMany({
      where: {
        id: ticket.id,
        tenantId: ticket.tenantId,
        deletedAt: null,
        status: TicketStatus.verified,
        verifiedAt: { lt: cutoff },
      },
      data: { deletedAt: now },
    });
    if (updated.count === 0) continue;
    purged += 1;

    const att = await prisma.attachment.updateMany({
      where: {
        tenantId: ticket.tenantId,
        ticketId: ticket.id,
        deletedAt: null,
      },
      data: { deletedAt: now },
    });
    attachments += att.count;

    await appendTicketEvent({
      tenantId: ticket.tenantId,
      ticketId: ticket.id,
      actorUserId: null,
      type: TicketEventType.gdprRetentionPurge,
      fromStatus: ticket.status,
      toStatus: ticket.status,
      meta: {
        cutoff: cutoff.toISOString(),
        months,
        attachmentsSoftDeleted: att.count,
      },
    });
  }

  return {
    cutoff: cutoff.toISOString(),
    dryRun: false,
    candidates: candidates.length,
    purged,
    attachments,
  };
}
