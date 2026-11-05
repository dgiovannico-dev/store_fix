/**
 * F7-07 — AiInvocation audit (metadata only, no raw prompt/response).
 */

import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";
import { logJson } from "@/infrastructure/log";

export type AiAuditContext = {
  tenantId: string;
  userId?: string | null;
  feature: string;
};

export function aiSoftBudgetLimit(): number {
  const n = Number(process.env.AI_SOFT_BUDGET_MONTHLY ?? "5000");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 5000;
}

export async function getAiUsageMonth(tenantId: string): Promise<{
  count: number;
  limit: number;
  softExceeded: boolean;
  from: Date;
}> {
  requireTenantId(tenantId);
  const from = new Date();
  from.setUTCDate(1);
  from.setUTCHours(0, 0, 0, 0);
  const limit = aiSoftBudgetLimit();
  const count = await prisma.aiInvocation.count({
    where: { tenantId, createdAt: { gte: from } },
  });
  return { count, limit, softExceeded: count >= limit, from };
}

/** Append-only; never throws to callers (assist path must stay soft-fail). */
export async function recordAiInvocation(input: {
  tenantId: string;
  userId?: string | null;
  feature: string;
  provider: string;
  model?: string | null;
  ok: boolean;
  latencyMs?: number | null;
  errorCode?: string | null;
}): Promise<void> {
  try {
    requireTenantId(input.tenantId);
    await prisma.aiInvocation.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        feature: input.feature.slice(0, 64),
        provider: input.provider.slice(0, 64),
        model: input.model?.slice(0, 128) ?? null,
        ok: input.ok,
        latencyMs: input.latencyMs ?? null,
        errorCode: input.errorCode?.slice(0, 64) ?? null,
      },
    });
    const usage = await getAiUsageMonth(input.tenantId);
    if (usage.softExceeded) {
      logJson("warn", "ai.soft_budget_exceeded", {
        tenantId: input.tenantId,
        count: usage.count,
        limit: usage.limit,
        feature: input.feature,
      });
    }
  } catch (e) {
    logJson("warn", "ai.invocation_record_failed", {
      tenantId: input.tenantId,
      feature: input.feature,
      err: (e as Error).message,
    });
  }
}
