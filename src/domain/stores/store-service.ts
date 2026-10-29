import type { Membership, Role } from "@prisma/client";
import { z } from "zod";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCanMutate } from "@/domain/rbac/guards";
import { storeScopeWhere } from "@/domain/rbac/store-scope";
import { prisma } from "@/infrastructure/db/prisma";
import {
  requireTenantId,
  tenantActiveWhere,
} from "@/infrastructure/db/tenant-scope";

const optionalHttpUrl = z
  .union([z.string().trim().max(500), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : v))
  .refine(
    (v) => v == null || /^https?:\/\//i.test(v),
    "webhookUrl deve essere http(s)",
  );

const optionalTopic = z
  .union([z.string().trim().max(64), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : v))
  .refine(
    (v) => v == null || /^[-_A-Za-z0-9]+$/.test(v),
    "ntfyTopic non valido",
  );

export const storeInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(240).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  zip: z.string().trim().max(20).optional().nullable(),
  timezone: z.string().trim().min(1).max(64).default("Europe/Rome"),
  contacts: z.string().trim().max(500).optional().nullable(),
  webhookUrl: optionalHttpUrl,
  ntfyTopic: optionalTopic,
});

export async function listStores(
  tenantId: string,
  membership?: Pick<Membership, "role" | "storeIds" | "deletedAt">,
) {
  requireTenantId(tenantId);
  return prisma.store.findMany({
    where: {
      ...tenantActiveWhere(tenantId),
      ...(membership ? storeScopeWhere(membership) : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function createStore(input: {
  tenantId: string;
  role: Role;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.crudStore);
  const parsed = storeInputSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, message: "Dati store non validi" };
  }
  const store = await prisma.store.create({
    data: {
      tenantId: input.tenantId,
      name: parsed.data.name,
      address: parsed.data.address ?? null,
      city: parsed.data.city ?? null,
      zip: parsed.data.zip ?? null,
      timezone: parsed.data.timezone,
      contacts: parsed.data.contacts ?? null,
      webhookUrl: parsed.data.webhookUrl ?? null,
      ntfyTopic: parsed.data.ntfyTopic ?? null,
    },
  });
  return { ok: true as const, store };
}

export async function updateStore(input: {
  tenantId: string;
  role: Role;
  storeId: string;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.crudStore);
  const parsed = storeInputSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, message: "Dati store non validi" };
  }
  const existing = await prisma.store.findFirst({
    where: { id: input.storeId, ...tenantActiveWhere(input.tenantId) },
  });
  if (!existing) {
    return { ok: false as const, message: "Punto vendita non trovato" };
  }
  const store = await prisma.store.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      address: parsed.data.address ?? null,
      city: parsed.data.city ?? null,
      zip: parsed.data.zip ?? null,
      timezone: parsed.data.timezone,
      contacts: parsed.data.contacts ?? null,
      webhookUrl: parsed.data.webhookUrl ?? null,
      ntfyTopic: parsed.data.ntfyTopic ?? null,
    },
  });
  return { ok: true as const, store };
}

export async function softDeleteStore(input: {
  tenantId: string;
  role: Role;
  storeId: string;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.crudStore);
  const existing = await prisma.store.findFirst({
    where: { id: input.storeId, ...tenantActiveWhere(input.tenantId) },
  });
  if (!existing) {
    return { ok: false as const, message: "Punto vendita non trovato" };
  }
  await prisma.store.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
  return { ok: true as const };
}

/** Restore soft-delete: solo owner / admin_hq (manageTenant), stesso tenant. */
export async function restoreStore(input: {
  tenantId: string;
  role: Role;
  storeId: string;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.manageTenant);
  const existing = await prisma.store.findFirst({
    where: {
      id: input.storeId,
      tenantId: input.tenantId,
      deletedAt: { not: null },
    },
  });
  if (!existing) {
    return { ok: false as const, message: "Store non archiviato o altro tenant" };
  }
  await prisma.store.update({
    where: { id: existing.id },
    data: { deletedAt: null },
  });
  return { ok: true as const };
}
