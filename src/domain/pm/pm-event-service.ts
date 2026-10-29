import { PmEventStatus, type Role } from "@prisma/client";
import { z } from "zod";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCanMutate, ForbiddenError } from "@/domain/rbac/guards";
import { canMutate } from "@/domain/rbac/can";
import { prisma } from "@/infrastructure/db/prisma";
import {
  requireTenantId,
  tenantActiveWhere,
} from "@/infrastructure/db/tenant-scope";

const optionalId = z
  .union([z.string().min(1), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : v));

export const pmEventInputSchema = z.object({
  storeId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  scheduledAt: z.coerce.date(),
  vendorId: optionalId,
  vendorContractId: optionalId,
  assetId: optionalId,
  notes: z
    .union([z.string().trim().max(2000), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
});

export function canManagePm(role: Role): boolean {
  return canMutate(role, RbacAction.managePmCalendar);
}

export async function listPmEvents(input: {
  tenantId: string;
  role: Role;
  /** Giorni avanti (default 30); include overdue planned */
  horizonDays?: number;
}) {
  requireTenantId(input.tenantId);
  if (!canManagePm(input.role)) {
    throw new ForbiddenError(undefined, "pmCalendarForbidden");
  }
  const horizon = input.horizonDays ?? 30;
  const until = new Date(Date.now() + horizon * 24 * 60 * 60 * 1000);

  return prisma.plannedMaintenanceEvent.findMany({
    where: {
      tenantId: input.tenantId,
      deletedAt: null,
      status: PmEventStatus.planned,
      scheduledAt: { lte: until },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      store: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
      asset: { select: { id: true, label: true } },
    },
  });
}

export async function createPmEvent(input: {
  tenantId: string;
  role: Role;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.managePmCalendar);
  const parsed = pmEventInputSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, code: "invalidPmEventData" };
  }

  const store = await prisma.store.findFirst({
    where: { id: parsed.data.storeId, ...tenantActiveWhere(input.tenantId) },
  });
  if (!store) return { ok: false as const, code: "storeInvalid" };

  if (parsed.data.vendorId) {
    const v = await prisma.vendor.findFirst({
      where: {
        id: parsed.data.vendorId,
        ...tenantActiveWhere(input.tenantId),
      },
    });
    if (!v) return { ok: false as const, code: "vendorInvalid" };
  }

  if (parsed.data.vendorContractId) {
    const c = await prisma.vendorContract.findFirst({
      where: {
        id: parsed.data.vendorContractId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });
    if (!c) return { ok: false as const, code: "contractInvalid" };
  }

  if (parsed.data.assetId) {
    const a = await prisma.asset.findFirst({
      where: {
        id: parsed.data.assetId,
        tenantId: input.tenantId,
        deletedAt: null,
        storeId: parsed.data.storeId,
      },
    });
    if (!a) return { ok: false as const, code: "assetInvalidForStore" };
  }

  const event = await prisma.plannedMaintenanceEvent.create({
    data: {
      tenantId: input.tenantId,
      storeId: parsed.data.storeId,
      title: parsed.data.title,
      scheduledAt: parsed.data.scheduledAt,
      vendorId: parsed.data.vendorId,
      vendorContractId: parsed.data.vendorContractId,
      assetId: parsed.data.assetId,
      notes: parsed.data.notes,
      status: PmEventStatus.planned,
    },
  });
  return { ok: true as const, event };
}

export async function markPmEventDone(input: {
  tenantId: string;
  role: Role;
  eventId: string;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.managePmCalendar);
  const existing = await prisma.plannedMaintenanceEvent.findFirst({
    where: {
      id: input.eventId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!existing) return { ok: false as const, code: "pmVisitNotFound" };
  if (existing.status !== PmEventStatus.planned) {
    return { ok: false as const, code: "pmVisitAlreadyClosed" };
  }
  const event = await prisma.plannedMaintenanceEvent.update({
    where: { id: existing.id },
    data: { status: PmEventStatus.done },
  });
  return { ok: true as const, event };
}

export async function softDeletePmEvent(input: {
  tenantId: string;
  role: Role;
  eventId: string;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.role, RbacAction.managePmCalendar);
  const existing = await prisma.plannedMaintenanceEvent.findFirst({
    where: {
      id: input.eventId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!existing) return { ok: false as const, code: "pmVisitNotFound" };
  await prisma.plannedMaintenanceEvent.update({
    where: { id: existing.id },
    data: { deletedAt: new Date(), status: PmEventStatus.cancelled },
  });
  return { ok: true as const };
}
