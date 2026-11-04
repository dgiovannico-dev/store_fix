import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "@/infrastructure/db/prisma";
import { sendEmail } from "@/infrastructure/email/mailer";

const MAX_ATTEMPTS = 8;
const STUCK_MINUTES = 5;

export type DispatchBatchResult = {
  claimed: number;
  sent: number;
  retried: number;
  dead: number;
};

function backoffSeconds(attempts: number): number {
  // 30s, 60s, 2m, 4m, 8m, 16m, 32m, …
  return Math.min(30 * 2 ** Math.max(0, attempts - 1), 3600);
}

type ClaimedRow = {
  id: string;
  toAddr: string;
  subject: string;
  textBody: string;
  htmlBody: string | null;
  attempts: number;
  lockToken: string | null;
};

/**
 * Claim PENDING (due) + stuck PROCESSING, send via Nodemailer, mark SENT / retry / DEAD.
 * Fenced updates require matching lockToken.
 */
export async function processEmailOutboxBatch(
  limit = 20,
  deps: { send?: typeof sendEmail } = {},
): Promise<DispatchBatchResult> {
  const send = deps.send ?? sendEmail;
  const take = Math.min(Math.max(1, limit), 100);
  const lockToken = randomBytes(16).toString("hex");
  const stuckBefore = new Date(Date.now() - STUCK_MINUTES * 60_000);

  const rows = await prisma.$queryRaw<ClaimedRow[]>(Prisma.sql`
    UPDATE "EmailOutbox"
    SET
      status = 'processing',
      "lockedAt" = NOW(),
      "lockToken" = ${lockToken},
      attempts = attempts + 1,
      "updatedAt" = NOW()
    WHERE id IN (
      SELECT id FROM "EmailOutbox"
      WHERE
        (status = 'pending' AND "nextAttemptAt" <= NOW())
        OR (status = 'processing' AND "lockedAt" IS NOT NULL AND "lockedAt" < ${stuckBefore})
      ORDER BY "createdAt" ASC
      LIMIT ${take}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, "toAddr", subject, "textBody", "htmlBody", attempts, "lockToken"
  `);

  let sent = 0;
  let retried = 0;
  let dead = 0;

  for (const row of rows) {
    try {
      await send({
        to: row.toAddr,
        subject: row.subject,
        text: row.textBody,
        html: row.htmlBody ?? undefined,
      });
      const updated = await prisma.emailOutbox.updateMany({
        where: { id: row.id, lockToken },
        data: {
          status: "sent",
          sentAt: new Date(),
          lockedAt: null,
          lockToken: null,
          lastError: null,
        },
      });
      if (updated.count === 1) sent += 1;
    } catch (e) {
      const err =
        e instanceof Error ? e.message.slice(0, 500) : "send_failed";
      if (row.attempts >= MAX_ATTEMPTS) {
        const updated = await prisma.emailOutbox.updateMany({
          where: { id: row.id, lockToken },
          data: {
            status: "dead",
            lockedAt: null,
            lockToken: null,
            lastError: err,
          },
        });
        if (updated.count === 1) dead += 1;
      } else {
        const next = new Date(
          Date.now() + backoffSeconds(row.attempts) * 1000,
        );
        const updated = await prisma.emailOutbox.updateMany({
          where: { id: row.id, lockToken },
          data: {
            status: "pending",
            nextAttemptAt: next,
            lockedAt: null,
            lockToken: null,
            lastError: err,
          },
        });
        if (updated.count === 1) retried += 1;
      }
    }
  }

  return { claimed: rows.length, sent, retried, dead };
}

/** GC SENT rows older than retentionDays (default 30). */
export async function gcSentEmailOutbox(
  retentionDays = 30,
): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await prisma.emailOutbox.deleteMany({
    where: { status: "sent", sentAt: { lt: cutoff } },
  });
  return { deleted: result.count };
}
