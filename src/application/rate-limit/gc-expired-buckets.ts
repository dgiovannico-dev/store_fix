import { prisma } from "@/infrastructure/db/prisma";

/**
 * Delete fixed-window buckets whose window already ended.
 * Safe for memory-store deploys too (no-op if table empty / unused).
 */
export type GcExpiredRateLimitBucketsResult = {
  cutoff: string;
  dryRun: boolean;
  deleted: number;
};

export async function gcExpiredRateLimitBuckets(opts?: {
  now?: Date;
  dryRun?: boolean;
}): Promise<GcExpiredRateLimitBucketsResult> {
  const now = opts?.now ?? new Date();
  const dryRun =
    opts?.dryRun === true || process.env.RATE_LIMIT_GC_DRY_RUN === "true";

  if (dryRun) {
    const count = await prisma.rateLimitBucket.count({
      where: { resetAt: { lt: now } },
    });
    return { cutoff: now.toISOString(), dryRun: true, deleted: count };
  }

  const result = await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: now } },
  });
  return { cutoff: now.toISOString(), dryRun: false, deleted: result.count };
}
