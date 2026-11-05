import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/infrastructure/db/prisma";
import {
  appendEmailOutbox,
  kickEmailOutboxDispatch,
} from "@/infrastructure/email/outbox";
import { checkActionRateLimit } from "@/infrastructure/rate-limit-action";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { rateLimitKey } from "@/infrastructure/security/client-ip";
import { appBaseUrl } from "@/lib/app-urls";

const RESET_TTL_MS = 60 * 60 * 1000;
const RESET_PREFIX = "pwdreset:";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}


/**
 * Richiede reset: sempre messaggio generico (no user enumeration).
 * Token in VerificationToken con identifier = `pwdreset:email`.
 * Dual bucket: per-IP (`headers`) + per-email — silent no-op when limited.
 */
export async function requestPasswordReset(
  emailRaw: string,
  headers?: Headers,
): Promise<void> {
  if (headers) {
    const ipLimit = await checkActionRateLimit(
      rateLimitKey("pwdreset-ip", headers),
      RATE_LIMIT.pwdresetIp,
    );
    if (ipLimit.limited) return;
  }

  const email = emailRaw.trim().toLowerCase();
  const limit = await checkActionRateLimit(
    `pwdreset:${email}`,
    RATE_LIMIT.pwdreset,
  );
  if (limit.limited) return;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const identifier = `${RESET_PREFIX}${email}`;
  const raw = randomBytes(32).toString("hex");
  const url = `${appBaseUrl()}/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;

  await prisma.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({ where: { identifier } });
    await tx.verificationToken.create({
      data: {
        identifier,
        token: hashToken(raw),
        expires: new Date(Date.now() + RESET_TTL_MS),
      },
    });
    // Pre-tenant: default IT (MVP); Accept-Language later.
    await appendEmailOutbox(tx, {
      to: email,
      template: "password_reset",
      locale: "it",
      vars: { resetUrl: url },
      idempotencyKey: `password_reset:${email}:${raw.slice(0, 8)}`,
    });
  });
  await kickEmailOutboxDispatch();
}

export async function resetPassword(input: {
  email: string;
  rawToken: string;
  newPassword: string;
}): Promise<
  { ok: true } | { ok: false; code: string; message?: string }
> {
  if (input.newPassword.length < 8) {
    return { ok: false, code: "passwordTooShort" };
  }
  const email = input.email.trim().toLowerCase();
  const identifier = `${RESET_PREFIX}${email}`;
  const row = await prisma.verificationToken.findUnique({
    where: { token: hashToken(input.rawToken) },
  });
  if (!row || row.identifier !== identifier) {
    return { ok: false, code: "resetLinkInvalid" };
  }
  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: row.token } }).catch(() => {});
    return { ok: false, code: "resetLinkExpired" };
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: false, code: "resetLinkInvalid" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.verificationToken.delete({ where: { token: row.token } }),
  ]);

  return { ok: true };
}
