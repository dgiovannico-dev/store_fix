import { Role } from "@prisma/client";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { ForbiddenError } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

/**
 * Export GDPR core (US-E12-01): solo owner / admin_hq, stesso tenant.
 * Nessuna nota interna vendor-scoped oltre ai campi ticket pubblici.
 */
export async function exportTenantGdpr(input: {
  tenantId: string;
  role: Role;
}): Promise<{ exportedAt: string; region: string; data: unknown }> {
  requireTenantId(input.tenantId);
  if (!can(input.role, RbacAction.exportGdpr)) {
    throw new ForbiddenError("Export GDPR non consentito");
  }

  const tenant = await prisma.tenant.findFirstOrThrow({
    where: { id: input.tenantId },
  });

  const [stores, vendors, assets, memberships, tickets, users] =
    await Promise.all([
      prisma.store.findMany({ where: { tenantId: input.tenantId } }),
      prisma.vendor.findMany({ where: { tenantId: input.tenantId } }),
      prisma.asset.findMany({ where: { tenantId: input.tenantId } }),
      prisma.membership.findMany({
        where: { tenantId: input.tenantId },
        select: {
          id: true,
          userId: true,
          role: true,
          storeIds: true,
          vendorId: true,
          deletedAt: true,
          createdAt: true,
        },
      }),
      prisma.ticket.findMany({
        where: { tenantId: input.tenantId },
        select: {
          id: true,
          storeId: true,
          assetId: true,
          category: true,
          priority: true,
          status: true,
          description: true,
          vendorId: true,
          actualCost: true,
          openedAt: true,
          verifiedAt: true,
          doneAt: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.findMany({
        where: { memberships: { some: { tenantId: input.tenantId } } },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    region: tenant.region ?? "EU",
    data: {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        region: tenant.region,
        createdAt: tenant.createdAt,
      },
      retentionPolicy: {
        verifiedTicketsMonths: 24,
        note: "Job pg-boss gdpr.purge soft-delete verified oltre 24 mesi; SeaweedFS GC ops",
      },
      stores,
      vendors,
      assets,
      memberships,
      tickets,
      users,
    },
  };
}
