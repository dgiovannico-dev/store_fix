import { createHash, randomBytes } from "crypto";
import { Role } from "@prisma/client";
import { z } from "zod";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";
import { enqueueEmail } from "@/infrastructure/email/outbox";
import { prisma } from "@/infrastructure/db/prisma";
import { RbacAction } from "@/domain/rbac/actions";
import { assertCanMutate } from "@/domain/rbac/guards";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const createInviteSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.nativeEnum(Role),
  storeIds: z.array(z.string()).default([]),
  vendorId: z.string().optional().nullable(),
});

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function createInvite(input: {
  tenantId: string;
  actorRole: Role;
  actorUserId: string;
  email: string;
  role: Role;
  storeIds?: string[];
  vendorId?: string | null;
}): Promise<
  | { ok: true; inviteId: string; acceptUrl: string }
  | { ok: false; message: string; code: string }
> {
  requireTenantId(input.tenantId);
  assertCanMutate(input.actorRole, RbacAction.inviteUsers);

  const parsed = createInviteSchema.safeParse({
    email: input.email,
    role: input.role,
    storeIds: input.storeIds ?? [],
    vendorId: input.vendorId,
  });
  if (!parsed.success) {
    return { ok: false, message: "Dati invito non validi", code: "invalidInviteData" };
  }

  if (parsed.data.role === Role.owner) {
    return { ok: false, message: "Non puoi invitare un altro owner", code: "cannotInviteOwner" };
  }

  if (parsed.data.role === Role.vendor) {
    if (!parsed.data.vendorId) {
      return {
        ok: false,
        message: "vendorId obbligatorio per ruolo vendor",
        code: "vendorIdRequiredForVendor",
      };
    }
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: parsed.data.vendorId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });
    if (!vendor) {
      return { ok: false, message: "Fornitore non trovato nel tenant", code: "vendorNotInTenant" };
    }
  }

  const raw = randomBytes(32).toString("hex");
  const invite = await prisma.inviteToken.create({
    data: {
      tenantId: input.tenantId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      storeIds: parsed.data.storeIds,
      vendorId: parsed.data.vendorId ?? null,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      createdById: input.actorUserId,
    },
  });

  const acceptUrl = `${appBaseUrl()}/invite/${raw}`;
  const { locale } = await getTenantI18nPrefs(input.tenantId);
  await enqueueEmail({
    to: invite.email,
    template: "invite",
    locale,
    vars: { acceptUrl, role: invite.role },
    idempotencyKey: `invite:${invite.id}`,
  });

  return { ok: true, inviteId: invite.id, acceptUrl };
}

export async function acceptInvite(input: {
  rawToken: string;
  name: string;
  password: string;
}): Promise<
  | { ok: true; email: string; tenantId: string; role: Role }
  | {
      ok: false;
      code: "inviteInvalid" | "inviteExpired" | "inviteAccepted";
      message: string;
    }
> {
  const tokenHash = hashToken(input.rawToken);
  const invite = await prisma.inviteToken.findUnique({ where: { tokenHash } });
  if (!invite) {
    return {
      ok: false,
      code: "inviteInvalid",
      message: "Invito non valido",
    };
  }
  if (invite.acceptedAt) {
    return {
      ok: false,
      code: "inviteAccepted",
      message: "Invito già usato",
    };
  }
  if (invite.expiresAt < new Date()) {
    return {
      ok: false,
      code: "inviteExpired",
      message: "Invito scaduto",
    };
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: invite.email },
      update: { passwordHash, name: input.name },
      create: {
        email: invite.email,
        name: input.name,
        passwordHash,
        emailVerified: new Date(),
      },
    });

    await tx.membership.upsert({
      where: {
        tenantId_userId: { tenantId: invite.tenantId, userId: user.id },
      },
      update: {
        role: invite.role,
        storeIds: invite.storeIds,
        vendorId: invite.vendorId,
        deletedAt: null,
      },
      create: {
        tenantId: invite.tenantId,
        userId: user.id,
        role: invite.role,
        storeIds: invite.storeIds,
        vendorId: invite.vendorId,
      },
    });

    await tx.inviteToken.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  return {
    ok: true,
    email: invite.email,
    tenantId: invite.tenantId,
    role: invite.role,
  };
}
