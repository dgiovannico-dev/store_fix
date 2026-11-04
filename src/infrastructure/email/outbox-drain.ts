import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { sendEmail } from "./mailer";

/** Claim + send pending outbox rows (SKIP LOCKED). */
export async function drainEmailOutbox(limit = 20): Promise<{
  sent: number;
  failed: number;
}> {
  const workerId = `w-${process.pid}-${Date.now()}`;
  const take = Math.min(Math.max(1, limit), 100);
  const rows = await prisma.$queryRaw<
    {
      id: string;
      toAddr: string;
      subject: string;
      textBody: string;
      htmlBody: string | null;
    }[]
  >(Prisma.sql`
    UPDATE "EmailOutbox"
    SET status = 'sending',
        "lockedAt" = NOW(),
        "lockedBy" = ${workerId},
        attempts = attempts + 1
    WHERE id IN (
      SELECT id FROM "EmailOutbox"
      WHERE status = 'pending'
      ORDER BY "createdAt" ASC
      LIMIT ${take}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, "toAddr", subject, "textBody", "htmlBody"
  `);

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      await sendEmail({
        to: row.toAddr,
        subject: row.subject,
        text: row.textBody,
        html: row.htmlBody ?? undefined,
      });
      await prisma.emailOutbox.update({
        where: { id: row.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastError: null,
        },
      });
      sent += 1;
    } catch (e) {
      failed += 1;
      await prisma.emailOutbox.update({
        where: { id: row.id },
        data: {
          status: "failed",
          lockedAt: null,
          lockedBy: null,
          lastError:
            e instanceof Error ? e.message.slice(0, 500) : "send_failed",
        },
      });
    }
  }
  return { sent, failed };
}
