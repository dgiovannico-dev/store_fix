import type { Membership, Role } from "@prisma/client";
import { z } from "zod";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { ForbiddenError } from "@/domain/rbac/guards";
import {
  assertAllowedUpload,
  StorageValidationError,
} from "@/infrastructure/storage/types";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId, tenantActiveWhere } from "@/infrastructure/db/tenant-scope";

export const confirmAttachmentSchema = z.object({
  ticketId: z.string().min(1),
  storageKey: z.string().min(3).max(512),
  mime: z.string().min(3),
  sizeBytes: z.number().int().positive(),
});

export async function confirmAttachmentUpload(input: {
  tenantId: string;
  actorUserId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt" | "vendorId">;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  const parsed = confirmAttachmentSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, message: "Metadati allegato non validi", code: "invalidAttachmentMeta" };
  }

  try {
    assertAllowedUpload(parsed.data.mime, parsed.data.sizeBytes);
  } catch (e) {
    if (e instanceof StorageValidationError) {
      return {
        ok: false as const,
        message: e.message,
        code: e.code,
        params: e.params,
      };
    }
    return {
      ok: false as const,
      message: e instanceof Error ? e.message : "Upload non valido",
      code: "uploadInvalid",
    };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: parsed.data.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket) {
    return { ok: false as const, message: "Ticket non trovato", code: "ticketNotFound" };
  }

  if (input.role === "vendor") {
    if (
      !input.membership.vendorId ||
      ticket.vendorId !== input.membership.vendorId
    ) {
      throw new ForbiddenError("Ticket fuori scope vendor", "vendorOutOfScope");
    }
  } else if (!canAccessStore(input.membership, ticket.storeId)) {
    throw new ForbiddenError("Ticket fuori scope store", "storeOutOfScope");
  }

  // storageKey must belong to tenant path
  if (!parsed.data.storageKey.startsWith(`tenants/${input.tenantId}/`)) {
    return { ok: false as const, message: "storageKey non valido", code: "invalidStorageKey" };
  }

  const attachment = await prisma.attachment.create({
    data: {
      tenantId: input.tenantId,
      ticketId: ticket.id,
      storageKey: parsed.data.storageKey,
      mime: parsed.data.mime,
      sizeBytes: parsed.data.sizeBytes,
      uploadedByUserId: input.actorUserId,
    },
  });

  return { ok: true as const, attachment };
}

export async function softDeleteAttachment(input: {
  tenantId: string;
  attachmentId: string;
}) {
  requireTenantId(input.tenantId);
  const existing = await prisma.attachment.findFirst({
    where: {
      id: input.attachmentId,
      ...tenantActiveWhere(input.tenantId),
    },
  });
  if (!existing) {
    return { ok: false as const, message: "Allegato non trovato", code: "attachmentNotFound" };
  }
  await prisma.attachment.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
  // Oggetto SeaweedFS non eliminato (GC futuro) — T2.5 / T2.10
  return { ok: true as const };
}
