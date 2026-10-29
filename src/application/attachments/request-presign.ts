import type { Membership, Role } from "@prisma/client";
import { z } from "zod";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { ForbiddenError } from "@/domain/rbac/guards";
import {
  assertAllowedUpload,
  StorageValidationError,
} from "@/infrastructure/storage/types";
import {
  buildAttachmentKey,
  getSignedPutUrl,
} from "@/infrastructure/storage/s3";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export const requestPresignSchema = z.object({
  ticketId: z.string().min(1),
  filename: z.string().min(1).max(200),
  mime: z.string().min(3),
  sizeBytes: z.number().int().positive(),
});

export async function requestAttachmentPresign(input: {
  tenantId: string;
  actorUserId: string;
  role: Role;
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt" | "vendorId">;
  data: unknown;
}) {
  requireTenantId(input.tenantId);
  const parsed = requestPresignSchema.safeParse(input.data);
  if (!parsed.success) {
    return { ok: false as const, code: "invalidUploadMeta" };
  }

  try {
    assertAllowedUpload(parsed.data.mime, parsed.data.sizeBytes);
  } catch (e) {
    if (e instanceof StorageValidationError) {
      return {
        ok: false as const,
        code: e.code,
        params: e.params,
      };
    }
    return { ok: false as const, code: "uploadInvalid" };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: parsed.data.ticketId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
  });
  if (!ticket) {
    return { ok: false as const, code: "ticketNotFound" };
  }

  if (input.role === "vendor") {
    if (
      !input.membership.vendorId ||
      ticket.vendorId !== input.membership.vendorId
    ) {
      throw new ForbiddenError(undefined, "vendorOutOfScope");
    }
  } else if (!canAccessStore(input.membership, ticket.storeId)) {
    throw new ForbiddenError(undefined, "storeOutOfScope");
  }

  const key = buildAttachmentKey({
    tenantId: input.tenantId,
    ticketId: ticket.id,
    filename: parsed.data.filename,
  });

  const signed = await getSignedPutUrl({
    key,
    mime: parsed.data.mime,
    sizeBytes: parsed.data.sizeBytes,
  });

  return {
    ok: true as const,
    uploadUrl: signed.url,
    expiresIn: signed.expiresIn,
    storageKey: signed.key,
    mime: parsed.data.mime,
  };
}
