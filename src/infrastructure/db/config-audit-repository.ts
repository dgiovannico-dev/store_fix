import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

type Tx = Prisma.TransactionClient | typeof prisma;

export async function appendConfigAuditEvent(
  input: {
    tenantId: string;
    actorUserId?: string | null;
    type: string;
    membershipId?: string | null;
    targetUserId?: string | null;
    meta?: Prisma.InputJsonValue;
  },
  db: Tx = prisma,
) {
  requireTenantId(input.tenantId);
  return db.configAuditEvent.create({
    data: {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId ?? null,
      type: input.type,
      membershipId: input.membershipId ?? null,
      targetUserId: input.targetUserId ?? null,
      meta: input.meta ?? undefined,
    },
  });
}

export async function listConfigAuditEvents(input: {
  tenantId: string;
  take?: number;
}) {
  requireTenantId(input.tenantId);
  return prisma.configAuditEvent.findMany({
    where: { tenantId: input.tenantId },
    orderBy: { createdAt: "desc" },
    take: input.take ?? 100,
  });
}
