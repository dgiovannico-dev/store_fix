import type { Role } from "@prisma/client";
import { z } from "zod";
import { RbacAction } from "@/domain/rbac/actions";
import { can, canMutate } from "@/domain/rbac/can";
import { assertCanMutate, ForbiddenError } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import {
  requireTenantId,
  tenantActiveWhere,
} from "@/infrastructure/db/tenant-scope";

const dateOnly = z.coerce.date();

export const vendorContractInputSchema = z
  .object({
    vendorId: z.string().min(1),
    storeId: z
      .union([z.string().min(1), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v == null ? null : v)),
    title: z.string().trim().min(2).max(200),
    reference: z
      .union([z.string().trim().max(120), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v == null ? null : v)),
    startsOn: dateOnly,
    endsOn: dateOnly,
    annualFee: z.coerce.number().nonnegative().max(10_000_000).optional().nullable(),
    notes: z
      .union([z.string().trim().max(2000), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v == null ? null : v)),
  })
  .refine((d) => d.endsOn >= d.startsOn, {
    message: "endsOn before startsOn",
    path: ["endsOn"],
  });

export function canReadVendorContracts(role: Role): boolean {
  return canMutate(role, RbacAction.crudVendorContract) || can(role, RbacAction.dashboardHq);
}

export async function listVendorContracts(input: {
  tenantId: string;
  role: Role;
  /** Se true, solo endsOn entro 60 giorni (include scaduti recenti nel filtro “in scadenza”) */
  expiringWithinDays?: number | null;
  vendorId?: string;
}) {
  requireTenantId(input.tenantId);
  if (!canReadVendorContracts(input.role)) {
    throw new ForbiddenError("Contratti non consentiti", "contractsForbidden");
  }

  const now = new Date();
  const where: {
    tenantId: string;
    deletedAt: null;
    vendorId?: string;
    endsOn?: { lte: Date };
  } = {
    tenantId: input.tenantId,
    deletedAt: null,
  };
  if (input.vendorId) where.vendorId = input.vendorId;
  if (input.expiringWithinDays != null) {
    const until = new Date(
      now.getTime() + input.expiringWithinDays * 24 * 60 * 60 * 1000,
    );
    where.endsOn = { lte: until };
  }

  return prisma.vendorContract.findMany({
    where,
    orderBy: { endsOn: "asc" },
    include: {
      vendor: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
    },
  });
}

async function assertVendorInTenant(
  tenantId: string,
  vendorId: string,
): Promise<{ message: string; code: string } | null> {
  const v = await prisma.vendor.findFirst({
    where: { id: vendorId, ...tenantActiveWhere(tenantId) },
  });
  return v
    ? null
    : { message: "Fornitore non valido", code: "vendorInvalid" };
}

async function assertStoreInTenant(
  tenantId: string,
  storeId: string | null,
): Promise<{ message: string; code: string } | null> {
  if (!storeId) return null;
  const s = await prisma.store.findFirst({
    where: { id: storeId, ...tenantActiveWhere(tenantId) },
  });
  return s
    ? null
    : { message: "Punto vendita non valido", code: "storeInvalid" };
}

export async function createVendorContract(input: {
  tenantId: string;
  role: Role;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.crudVendorContract);
  const parsed = vendorContractInputSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, message: "Dati contratto non validi", code: "invalidContractData" };
  }
  const vendorErr = await assertVendorInTenant(
    input.tenantId,
    parsed.data.vendorId,
  );
  if (vendorErr) {
    return { ok: false as const, message: vendorErr.message, code: vendorErr.code };
  }
  const storeErr = await assertStoreInTenant(
    input.tenantId,
    parsed.data.storeId,
  );
  if (storeErr) {
    return { ok: false as const, message: storeErr.message, code: storeErr.code };
  }

  const contract = await prisma.vendorContract.create({
    data: {
      tenantId: input.tenantId,
      vendorId: parsed.data.vendorId,
      storeId: parsed.data.storeId,
      title: parsed.data.title,
      reference: parsed.data.reference,
      startsOn: parsed.data.startsOn,
      endsOn: parsed.data.endsOn,
      annualFee: parsed.data.annualFee ?? null,
      notes: parsed.data.notes,
    },
  });
  return { ok: true as const, contract };
}

export async function softDeleteVendorContract(input: {
  tenantId: string;
  role: Role;
  contractId: string;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.crudVendorContract);
  const existing = await prisma.vendorContract.findFirst({
    where: {
      id: input.contractId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!existing) {
    return { ok: false as const, message: "Contratto non trovato", code: "contractNotFound" };
  }
  await prisma.vendorContract.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
  return { ok: true as const };
}
