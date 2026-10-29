import { prisma } from "@/infrastructure/db/prisma";
import { deleteAttachmentObject } from "@/infrastructure/storage/s3";

/** Grace default: 7 giorni dopo soft-delete prima di DeleteObject. */
export const ATTACHMENT_GC_GRACE_DAYS_DEFAULT = 7;

const BATCH = 100;

export type GcSoftDeletedResult = {
  cutoff: string;
  dryRun: boolean;
  candidates: number;
  purged: number;
  failed: number;
};

export function gcGraceCutoff(
  now = new Date(),
  graceDays = ATTACHMENT_GC_GRACE_DAYS_DEFAULT,
): Date {
  const d = new Date(now.getTime());
  d.setUTCDate(d.getUTCDate() - graceDays);
  return d;
}

/**
 * Elimina oggetti SeaweedFS per allegati soft-deleted oltre grace.
 * Idempotente: `storagePurgedAt IS NULL` + `deletedAt < cutoff`.
 * Nessuna restore attachment in prodotto (SOFT_DELETE.md).
 */
export async function gcSoftDeletedAttachments(opts?: {
  now?: Date;
  graceDays?: number;
  dryRun?: boolean;
  take?: number;
  deleteObject?: (key: string) => Promise<void>;
}): Promise<GcSoftDeletedResult> {
  const now = opts?.now ?? new Date();
  const graceDays =
    opts?.graceDays ??
    Number(
      process.env.ATTACHMENT_GC_GRACE_DAYS ?? ATTACHMENT_GC_GRACE_DAYS_DEFAULT,
    );
  const dryRun =
    opts?.dryRun === true || process.env.ATTACHMENT_GC_DRY_RUN === "true";
  const take = opts?.take ?? BATCH;
  const cutoff = gcGraceCutoff(now, graceDays);
  const deleteObject = opts?.deleteObject ?? deleteAttachmentObject;

  const candidates = await prisma.attachment.findMany({
    where: {
      deletedAt: { not: null, lt: cutoff },
      storagePurgedAt: null,
    },
    select: { id: true, tenantId: true, storageKey: true },
    take,
    orderBy: { deletedAt: "asc" },
  });

  if (dryRun || candidates.length === 0) {
    return {
      cutoff: cutoff.toISOString(),
      dryRun,
      candidates: candidates.length,
      purged: 0,
      failed: 0,
    };
  }

  let purged = 0;
  let failed = 0;

  for (const row of candidates) {
    try {
      await deleteObject(row.storageKey);
      const updated = await prisma.attachment.updateMany({
        where: {
          id: row.id,
          tenantId: row.tenantId,
          storagePurgedAt: null,
          deletedAt: { not: null },
        },
        data: { storagePurgedAt: now },
      });
      if (updated.count > 0) purged += 1;
    } catch (err) {
      failed += 1;
      console.error(
        `[attachment.gc] fail id=${row.id} key=${row.storageKey}`,
        err,
      );
    }
  }

  return {
    cutoff: cutoff.toISOString(),
    dryRun: false,
    candidates: candidates.length,
    purged,
    failed,
  };
}
