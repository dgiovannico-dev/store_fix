import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export type ContractPerformanceRow = {
  id: string;
  vendorName: string;
  storeName: string | null;
  due: number;
  done: number;
};

/** CQRS read — contratto vs misurato PM (R3.3). */
export async function listContractPerformance(
  tenantId: string,
  since: Date,
): Promise<ContractPerformanceRow[]> {
  requireTenantId(tenantId);
  const contracts = await prisma.vendorContract.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      vendor: { select: { name: true } },
      store: { select: { name: true } },
    },
    take: 100,
  });

  return Promise.all(
    contracts.map(async (c) => {
      const [due, done] = await Promise.all([
        prisma.plannedMaintenanceEvent.count({
          where: {
            tenantId,
            vendorId: c.vendorId,
            storeId: c.storeId ?? undefined,
            deletedAt: null,
            scheduledAt: { gte: since },
          },
        }),
        prisma.plannedMaintenanceEvent.count({
          where: {
            tenantId,
            vendorId: c.vendorId,
            storeId: c.storeId ?? undefined,
            deletedAt: null,
            scheduledAt: { gte: since },
            status: "done",
          },
        }),
      ]);
      return {
        id: c.id,
        vendorName: c.vendor.name,
        storeName: c.store?.name ?? null,
        due,
        done,
      };
    }),
  );
}
