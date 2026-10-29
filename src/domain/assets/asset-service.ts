import type { Membership, Role } from "@prisma/client";
import { z } from "zod";
import { INTAKE_CATEGORY_VALUES } from "@/domain/intake/chat-steps";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCan, ForbiddenError } from "@/domain/rbac/guards";
import {
  canAccessStore,
  isHqAllStores,
} from "@/domain/rbac/store-scope";
import { prisma } from "@/infrastructure/db/prisma";
import {
  requireTenantId,
  tenantActiveWhere,
} from "@/infrastructure/db/tenant-scope";

/** Alias SoT intake — evita drift cataloghi asset vs ticket. */
export const ASSET_CATEGORIES = INTAKE_CATEGORY_VALUES;

export const assetInputSchema = z.object({
  storeId: z.string().min(1),
  category: z.enum(INTAKE_CATEGORY_VALUES),
  label: z.string().trim().min(2).max(160),
  brandModel: z.string().trim().max(160).optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  preferredVendorId: z.string().optional().nullable(),
  serial: z.string().trim().max(120).optional().nullable(),
});

function assertStoreScope(
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">,
  storeId: string,
) {
  if (!canAccessStore(membership, storeId)) {
    throw new ForbiddenError("Store fuori scope");
  }
}

export async function listAssets(input: {
  tenantId: string;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">;
  storeId?: string;
}) {
  requireTenantId(input.tenantId);
  assertCan(input.membership.role, RbacAction.crudAsset);

  if (input.storeId) {
    assertStoreScope(input.membership, input.storeId);
  }

  const storeFilter = input.storeId
    ? { storeId: input.storeId }
    : isHqAllStores(input.membership)
      ? {}
      : { storeId: { in: input.membership.storeIds } };

  return prisma.asset.findMany({
    where: {
      ...tenantActiveWhere(input.tenantId),
      ...storeFilter,
    },
    orderBy: { label: "asc" },
  });
}

export async function createAsset(input: {
  tenantId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCan(input.role, RbacAction.crudAsset);
  const parsed = assetInputSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, message: "Dati asset non validi" };
  }
  assertStoreScope(input.membership, parsed.data.storeId);

  const store = await prisma.store.findFirst({
    where: {
      id: parsed.data.storeId,
      ...tenantActiveWhere(input.tenantId),
    },
  });
  if (!store) {
    return { ok: false as const, message: "Punto vendita non trovato" };
  }

  if (parsed.data.preferredVendorId) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: parsed.data.preferredVendorId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });
    if (!vendor) {
      return { ok: false as const, message: "Vendor preferito non valido" };
    }
  }

  const asset = await prisma.asset.create({
    data: {
      tenantId: input.tenantId,
      storeId: parsed.data.storeId,
      category: parsed.data.category,
      label: parsed.data.label,
      brandModel: parsed.data.brandModel ?? null,
      location: parsed.data.location ?? null,
      notes: parsed.data.notes ?? null,
      preferredVendorId: parsed.data.preferredVendorId ?? null,
      serial: parsed.data.serial ?? null,
    },
  });
  return { ok: true as const, asset };
}

export async function softDeleteAsset(input: {
  tenantId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">;
  assetId: string;
}) {
  requireTenantId(input.tenantId);
  assertCan(input.role, RbacAction.crudAsset);

  const existing = await prisma.asset.findFirst({
    where: { id: input.assetId, ...tenantActiveWhere(input.tenantId) },
  });
  if (!existing) {
    return { ok: false as const, message: "Asset non trovato" };
  }
  assertStoreScope(input.membership, existing.storeId);

  await prisma.asset.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
  return { ok: true as const };
}
