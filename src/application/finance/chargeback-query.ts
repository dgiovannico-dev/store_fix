import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export type ChargebackRow = {
  storeId: string;
  name: string;
  tickets: number;
  estimated: number;
  actual: number;
};

/** CQRS read — chargeback per PV (R3.2). */
export async function listChargebackByStore(
  tenantId: string,
  days: number,
): Promise<ChargebackRow[]> {
  requireTenantId(tenantId);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const stores = await prisma.store.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    stores.map(async (s) => {
      const agg = await prisma.ticket.aggregate({
        where: {
          tenantId,
          storeId: s.id,
          deletedAt: null,
          OR: [
            { verifiedAt: { gte: since } },
            { doneAt: { gte: since } },
          ],
        },
        _sum: { estimatedCost: true, actualCost: true },
        _count: true,
      });
      return {
        storeId: s.id,
        name: s.name,
        tickets: agg._count,
        estimated: Number(agg._sum.estimatedCost ?? 0),
        actual: Number(agg._sum.actualCost ?? 0),
      };
    }),
  );
}
