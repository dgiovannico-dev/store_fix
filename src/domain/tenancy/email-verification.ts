import { createHash, randomBytes } from "crypto";
import { prisma } from "@/infrastructure/db/prisma";
import {
  appendEmailOutbox,
  kickEmailOutboxDispatch,
} from "@/infrastructure/email/outbox";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** Crea VerificationToken + outbox email nella stessa TX (T1.13 / F3-09). */
export async function sendEmailVerification(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  const raw = randomBytes(32).toString("hex");
  const verifyUrl = `${appBaseUrl()}/verify-email?token=${raw}&email=${encodeURIComponent(normalized)}`;

  await prisma.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({
      where: { identifier: normalized },
    });
    await tx.verificationToken.create({
      data: {
        identifier: normalized,
        token: hashToken(raw),
        expires: new Date(Date.now() + VERIFY_TTL_MS),
      },
    });
    await appendEmailOutbox(tx, {
      to: normalized,
      template: "email_verify",
      vars: { verifyUrl },
      idempotencyKey: `email_verify:${normalized}:${raw.slice(0, 8)}`,
    });
  });
  await kickEmailOutboxDispatch();
}

export type VerifyEmailResult =
  | { ok: true }
  | { ok: false; code: "emailVerifyInvalid" | "emailVerifyExpired" };

export async function confirmEmailVerification(
  email: string,
  rawToken: string,
): Promise<VerifyEmailResult> {
  const normalized = email.toLowerCase();
  const row = await prisma.verificationToken.findUnique({
    where: { token: hashToken(rawToken) },
  });

  if (!row || row.identifier !== normalized) {
    return { ok: false, code: "emailVerifyInvalid" };
  }
  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: row.token } }).catch(() => {});
    return { ok: false, code: "emailVerifyExpired" };
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { email: normalized },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token: row.token } }),
  ]);

  return { ok: true };
}
