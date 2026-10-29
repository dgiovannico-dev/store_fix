import { TicketPriority, type Prisma, type PrismaClient } from "@prisma/client";

export const DEFAULT_SLA_POLICIES: {
  category: string;
  priority: TicketPriority;
  resolutionHours: number;
}[] = [
  { category: "frigo", priority: TicketPriority.critical, resolutionHours: 4 },
  { category: "hvac", priority: TicketPriority.high, resolutionHours: 24 },
  { category: "altro", priority: TicketPriority.normal, resolutionHours: 72 },
];

type Tx = Prisma.TransactionClient | PrismaClient;

/** Idempotente: crea le 3 policy minime IT se mancanti (T1.31). */
export async function ensureDefaultSlaPolicies(
  tx: Tx,
  tenantId: string,
): Promise<number> {
  let created = 0;
  for (const d of DEFAULT_SLA_POLICIES) {
    const existing = await tx.slaPolicy.findUnique({
      where: {
        tenantId_category_priority: {
          tenantId,
          category: d.category,
          priority: d.priority,
        },
      },
    });
    if (existing) {
      if (existing.deletedAt) {
        await tx.slaPolicy.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
            resolutionHours: d.resolutionHours,
          },
        });
      }
      continue;
    }
    await tx.slaPolicy.create({
      data: {
        tenantId,
        category: d.category,
        priority: d.priority,
        resolutionHours: d.resolutionHours,
      },
    });
    created += 1;
  }
  return created;
}

export async function countActiveDefaultSla(
  tx: Tx,
  tenantId: string,
): Promise<number> {
  return tx.slaPolicy.count({
    where: {
      tenantId,
      deletedAt: null,
      OR: DEFAULT_SLA_POLICIES.map((d) => ({
        category: d.category,
        priority: d.priority,
      })),
    },
  });
}
