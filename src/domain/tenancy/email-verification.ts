import { createHash, randomBytes } from "crypto";
import { prisma } from "@/infrastructure/db/prisma";
import { enqueueEmail } from "@/infrastructure/email/outbox";

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

/** Crea VerificationToken e invia email di conferma (T1.13). */
export async function sendEmailVerification(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  await prisma.verificationToken.deleteMany({
    where: { identifier: normalized },
  });

  const raw = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: normalized,
      token: hashToken(raw),
      expires: new Date(Date.now() + VERIFY_TTL_MS),
    },
  });

  const verifyUrl = `${appBaseUrl()}/verify-email?token=${raw}&email=${encodeURIComponent(normalized)}`;
  await enqueueEmail({
    to: normalized,
    template: "email_verify",
    vars: { verifyUrl },
  });
}

export type VerifyEmailResult =
  | { ok: true }
  | { ok: false; code: "INVALID" | "EXPIRED" };

export async function confirmEmailVerification(
  email: string,
  rawToken: string,
): Promise<VerifyEmailResult> {
  const normalized = email.toLowerCase();
  const row = await prisma.verificationToken.findUnique({
    where: { token: hashToken(rawToken) },
  });

  if (!row || row.identifier !== normalized) {
    return { ok: false, code: "INVALID" };
  }
  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: row.token } }).catch(() => {});
    return { ok: false, code: "EXPIRED" };
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
