import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import type { RateLimitResult } from "@/infrastructure/rate-limit";

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Fixed-window counter in Postgres with per-key `pg_advisory_xact_lock`.
 * Same semantics as in-process `checkRateLimit`.
 */
export async function checkRateLimitPostgres(
  key: string,
  limit: number,
  windowMs: number,
  client: PrismaClient = prisma,
  now = Date.now(),
): Promise<RateLimitResult> {
  const resetAt = new Date(now + windowMs);
  return client.$transaction(async (tx: Tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!existing || existing.resetAt.getTime() <= now) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return {
        ok: true,
        remaining: limit - 1,
        retryAfterSec: Math.ceil(windowMs / 1000),
      };
    }
    if (existing.count >= limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSec: Math.max(
          1,
          Math.ceil((existing.resetAt.getTime() - now) / 1000),
        ),
      };
    }
    const updated = await tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return {
      ok: true,
      remaining: limit - updated.count,
      retryAfterSec: Math.ceil((existing.resetAt.getTime() - now) / 1000),
    };
  });
}
