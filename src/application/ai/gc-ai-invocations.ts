/**
 * F7-07 — retention soft AiInvocation (metadata only; default 90g).
 */

import { prisma } from "@/infrastructure/db/prisma";

export function aiInvocationRetentionDays(): number {
  const n = Number(process.env.AI_INVOCATION_RETENTION_DAYS ?? "90");
  return Number.isFinite(n) && n >= 7 ? Math.floor(n) : 90;
}

export async function gcAiInvocations(input?: {
  now?: Date;
  dryRun?: boolean;
}): Promise<{ dryRun: boolean; deleted: number; cutoff: string }> {
  const dryRun =
    input?.dryRun === true || process.env.AI_INVOCATION_GC_DRY_RUN === "true";
  const now = input?.now ?? new Date();
  const days = aiInvocationRetentionDays();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  if (dryRun) {
    const deleted = await prisma.aiInvocation.count({
      where: { createdAt: { lt: cutoff } },
    });
    return { dryRun: true, deleted, cutoff: cutoff.toISOString() };
  }

  const result = await prisma.aiInvocation.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return {
    dryRun: false,
    deleted: result.count,
    cutoff: cutoff.toISOString(),
  };
}
