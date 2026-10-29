import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/infrastructure/db/prisma";
import { enqueueEmail } from "@/infrastructure/email/outbox";
import { checkRateLimit } from "@/infrastructure/rate-limit";

const RESET_TTL_MS = 60 * 60 * 1000;
const RESET_PREFIX = "pwdreset:";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/**
 * Richiede reset: sempre messaggio generico (no user enumeration).
 * Token in VerificationToken con identifier = `pwdreset:email`.
 */
export async function requestPasswordReset(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  const limit = checkRateLimit(`pwdreset:${email}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const identifier = `${RESET_PREFIX}${email}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const raw = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashToken(raw),
      expires: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const url = `${appBaseUrl()}/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;
  // Pre-tenant: default IT (MVP); Accept-Language later.
  await enqueueEmail({
    to: email,
    template: "password_reset",
    locale: "it",
    vars: { resetUrl: url },
    idempotencyKey: `password_reset:${email}:${raw.slice(0, 8)}`,
  });
}

export async function resetPassword(input: {
  email: string;
  rawToken: string;
  newPassword: string;
}): Promise<
  { ok: true } | { ok: false; message: string; code: string }
> {
  if (input.newPassword.length < 8) {
    return { ok: false, message: "Password troppo corta", code: "passwordTooShort" };
  }
  const email = input.email.trim().toLowerCase();
  const identifier = `${RESET_PREFIX}${email}`;
  const row = await prisma.verificationToken.findUnique({
    where: { token: hashToken(input.rawToken) },
  });
  if (!row || row.identifier !== identifier) {
    return { ok: false, message: "Link non valido", code: "resetLinkInvalid" };
  }
  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: row.token } }).catch(() => {});
    return { ok: false, message: "Link scaduto", code: "resetLinkExpired" };
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: false, message: "Link non valido", code: "resetLinkInvalid" };
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
