import type { Role } from "@prisma/client";
import { z } from "zod";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCanMutate } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import {
  requireTenantId,
  tenantActiveWhere,
} from "@/infrastructure/db/tenant-scope";

export const vendorInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z
    .union([z.string().trim().email().max(254), z.literal(""), z.null()])
    .optional(),
  phone: z.union([z.string().trim().max(40), z.null()]).optional(),
  trades: z.array(z.string().trim().min(1).max(64)).default([]),
  storeCoverageIds: z.array(z.string().min(1)).default([]),
});

export async function listVendors(tenantId: string) {
  requireTenantId(tenantId);
  return prisma.vendor.findMany({
    where: tenantActiveWhere(tenantId),
    orderBy: { name: "asc" },
  });
}

export async function getVendor(tenantId: string, vendorId: string) {
  requireTenantId(tenantId);
  return prisma.vendor.findFirst({
    where: { id: vendorId, ...tenantActiveWhere(tenantId) },
  });
}

async function assertCoverageInTenant(
  tenantId: string,
  storeIds: string[],
): Promise<{ code: string } | null> {
  if (storeIds.length === 0) return null;
  const count = await prisma.store.count({
    where: {
      tenantId,
      deletedAt: null,
      id: { in: storeIds },
    },
  });
  if (count !== storeIds.length) {
    return { code: "vendorCoverageInvalid" };
  }
  return null;
}

export async function createVendor(input: {
  tenantId: string;
  role: Role;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.crudVendor);
  const parsed = vendorInputSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, code: "invalidVendorData" };
  }
  const coverageErr = await assertCoverageInTenant(
    input.tenantId,
    parsed.data.storeCoverageIds,
  );
  if (coverageErr) {
    return { ok: false as const, code: coverageErr.code };
  }

  const email =
    parsed.data.email === "" || parsed.data.email == null
      ? null
      : parsed.data.email;

  const vendor = await prisma.vendor.create({
    data: {
      tenantId: input.tenantId,
      name: parsed.data.name,
      email,
      phone: parsed.data.phone ?? null,
      trades: parsed.data.trades,
      storeCoverageIds: parsed.data.storeCoverageIds,
    },
  });
  return { ok: true as const, vendor };
}

export async function updateVendor(input: {
  tenantId: string;
  role: Role;
  vendorId: string;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.crudVendor);
  const parsed = vendorInputSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, code: "invalidVendorData" };
  }
  const existing = await getVendor(input.tenantId, input.vendorId);
  if (!existing) {
    return { ok: false as const, code: "vendorNotFound" };
  }
  const coverageErr = await assertCoverageInTenant(
    input.tenantId,
    parsed.data.storeCoverageIds,
  );
  if (coverageErr) {
    return { ok: false as const, code: coverageErr.code };
  }

  const email =
    parsed.data.email === "" || parsed.data.email == null
      ? null
      : parsed.data.email;

  const vendor = await prisma.vendor.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone ?? null,
      trades: parsed.data.trades,
      storeCoverageIds: parsed.data.storeCoverageIds,
    },
  });
  return { ok: true as const, vendor };
}

export async function softDeleteVendor(input: {
  tenantId: string;
  role: Role;
  vendorId: string;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.crudVendor);
  const existing = await getVendor(input.tenantId, input.vendorId);
  if (!existing) {
    return { ok: false as const, code: "vendorNotFound" };
  }
  await prisma.vendor.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
  return { ok: true as const };
}
