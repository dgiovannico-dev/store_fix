import { Role, type Prisma } from "@prisma/client";
import { z } from "zod";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCan, assertCanMutate } from "@/domain/rbac/guards";
import { appendConfigAuditEvent, listConfigAuditEvents } from "@/infrastructure/db/config-audit-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export const updateMembershipSchema = z.object({
  storeIds: z.array(z.string()).optional(),
  vendorId: z.string().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
});

export async function listMemberships(tenantId: string) {
  requireTenantId(tenantId);
  return prisma.membership.findMany({
    where: { tenantId },
    include: {
      user: { select: { id: true, email: true, name: true } },
      vendor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateMembership(input: {
  tenantId: string;
  actorRole: Role;
  actorUserId?: string | null;
  membershipId: string;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.actorRole, RbacAction.membershipStore);

  const parsed = updateMembershipSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, message: "Dati membership non validi", code: "invalidMembershipData" };
  }

  const existing = await prisma.membership.findFirst({
    where: { id: input.membershipId, tenantId: input.tenantId },
  });
  if (!existing) {
    return { ok: false as const, message: "Membership non trovata", code: "membershipNotFound" };
  }

  const nextRole = parsed.data.role ?? existing.role;
  const nextVendorId =
    parsed.data.vendorId !== undefined
      ? parsed.data.vendorId
      : existing.vendorId;
  const nextStoreIds =
    parsed.data.storeIds !== undefined
      ? parsed.data.storeIds
      : existing.storeIds;

  if (nextRole === Role.vendor && !nextVendorId) {
    return {
      ok: false as const,
      message: "vendorId obbligatorio per ruolo vendor",
    };
  }

  if (nextVendorId) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: nextVendorId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });
    if (!vendor) {
      return { ok: false as const, message: "Fornitore non valido", code: "vendorInvalid" };
    }
  }

  if (nextStoreIds.length > 0) {
    const count = await prisma.store.count({
      where: {
        tenantId: input.tenantId,
        deletedAt: null,
        id: { in: nextStoreIds },
      },
    });
    if (count !== nextStoreIds.length) {
      return { ok: false as const, message: "storeIds non validi per il tenant", code: "storeIdsInvalid" };
    }
  }

  const before = {
    role: existing.role,
    storeIds: existing.storeIds,
    vendorId: existing.vendorId,
    deletedAt: existing.deletedAt,
  };

  const membership = await prisma.$transaction(async (tx) => {
    const updated = await tx.membership.update({
      where: { id: existing.id },
      data: {
        role: nextRole,
        vendorId: nextRole === Role.vendor ? nextVendorId : null,
        storeIds: nextStoreIds,
        deletedAt: null,
      },
    });

    const meta: Prisma.InputJsonValue = {
      before,
      after: {
        role: updated.role,
        storeIds: updated.storeIds,
        vendorId: updated.vendorId,
        deletedAt: updated.deletedAt,
      },
    };

    await appendConfigAuditEvent(
      {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        type:
          parsed.data.role && parsed.data.role !== existing.role
            ? "membership.role_changed"
            : "membership.updated",
        membershipId: updated.id,
        targetUserId: updated.userId,
        meta,
      },
      tx,
    );

    return updated;
  });

  return { ok: true as const, membership };
}

/** Soft-disable: accesso bloccato (deletedAt). */
export async function softDisableMembership(input: {
  tenantId: string;
  actorRole: Role;
  actorUserId?: string | null;
  membershipId: string;
}) {
  requireTenantId(input.tenantId);
  assertCanMutate(input.actorRole, RbacAction.membershipStore);

  const existing = await prisma.membership.findFirst({
    where: { id: input.membershipId, tenantId: input.tenantId },
  });
  if (!existing) {
    return { ok: false as const, message: "Membership non trovata", code: "membershipNotFound" };
  }
  if (existing.role === Role.owner) {
    return { ok: false as const, message: "Non puoi disabilitare l'owner", code: "cannotDisableOwner" };
  }

  const membership = await prisma.$transaction(async (tx) => {
    const updated = await tx.membership.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });
    await appendConfigAuditEvent(
      {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        type: "membership.soft_disabled",
        membershipId: updated.id,
        targetUserId: updated.userId,
        meta: {
          before: { deletedAt: existing.deletedAt, role: existing.role },
          after: { deletedAt: updated.deletedAt, role: updated.role },
        },
      },
      tx,
    );
    return updated;
  });
  return { ok: true as const, membership };
}

export async function listMembershipConfigAudit(input: {
  tenantId: string;
  role: Role;
  take?: number;
}) {
  requireTenantId(input.tenantId);
  assertCan(input.role, RbacAction.viewConfigAudit);
  return listConfigAuditEvents({
    tenantId: input.tenantId,
    take: input.take,
  });
}

export async function getActiveMembership(userId: string, tenantId?: string) {
  return prisma.membership.findFirst({
    where: {
      userId,
      deletedAt: null,
      ...(tenantId ? { tenantId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
}
