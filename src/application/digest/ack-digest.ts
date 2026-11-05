import { digestWeekKey } from "@/application/digest/week-key";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export async function ackWeeklyDigest(input: {
  tenantId: string;
  userId: string;
  weekKey?: string;
}): Promise<{ ok: true; weekKey: string; created: boolean }> {
  requireTenantId(input.tenantId);
  const weekKey = input.weekKey?.trim() || digestWeekKey();
  try {
    await prisma.digestAck.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        weekKey,
      },
    });
    return { ok: true, weekKey, created: true };
  } catch {
    return { ok: true, weekKey, created: false };
  }
}

export async function hasAckedDigest(input: {
  tenantId: string;
  userId: string;
  weekKey?: string;
}): Promise<boolean> {
  const weekKey = input.weekKey ?? digestWeekKey();
  const row = await prisma.digestAck.findUnique({
    where: {
      tenantId_userId_weekKey: {
        tenantId: input.tenantId,
        userId: input.userId,
        weekKey,
      },
    },
  });
  return Boolean(row);
}
