/**
 * Worker Compose / locale: email.send + sla.check_breaches + email.imap_poll + gdpr.purge.
 * Avvio: npm run worker
 */
import { PgBoss } from "pg-boss";
import { pollImapInbound } from "../application/email-inbound/poll-imap";
import { purgeExpiredVerifiedTickets } from "../application/gdpr/purge-expired";
import { maintainPmJobs } from "../application/pm/maintain-pm";
import { checkSlaBreaches } from "../application/sla/check-breaches";
import { sendEmail } from "../infrastructure/email/mailer";
import { readImapInboundConfig } from "../infrastructure/email/imap-config";
import { openImapflowMailbox } from "../infrastructure/email/imapflow-mailbox";
import {
  QUEUE_EMAIL_IMAP_POLL,
  QUEUE_EMAIL_SEND,
  QUEUE_GDPR_PURGE,
  QUEUE_PM_MAINTAIN,
  QUEUE_SLA_CHECK,
} from "../infrastructure/jobs/boss";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL required for worker");
  }

  const boss = new PgBoss({ connectionString: url });
  boss.on("error", (err) => console.error("[worker/pg-boss]", err));
  await boss.start();
  await boss.createQueue(QUEUE_EMAIL_SEND);
  await boss.createQueue(QUEUE_SLA_CHECK);
  await boss.createQueue(QUEUE_EMAIL_IMAP_POLL);
  await boss.createQueue(QUEUE_PM_MAINTAIN);
  await boss.createQueue(QUEUE_GDPR_PURGE);

  await boss.work(
    QUEUE_EMAIL_SEND,
    { batchSize: 5 },
    async (jobs) => {
      for (const job of jobs) {
        const data = job.data as {
          to: string | string[];
          subject: string;
          text: string;
          html?: string;
        };
        console.log(`[worker] email.send → ${JSON.stringify(data.to)}`);
        await sendEmail(data);
      }
    },
  );

  await boss.work(QUEUE_SLA_CHECK, async () => {
    const result = await checkSlaBreaches();
    console.log(`[worker] sla.check_breaches → ${result.breached} nuovi`);
  });

  await boss.work(QUEUE_EMAIL_IMAP_POLL, async () => {
    const config = readImapInboundConfig();
    const result = await pollImapInbound({
      config,
      openMailbox: openImapflowMailbox,
    });
    if (result.skipped) {
      console.log(`[worker] email.imap_poll skip — ${result.reason}`);
      return;
    }
    console.log(
      `[worker] email.imap_poll → fetched=${result.fetched} created=${result.created} dup=${result.duplicates} fail=${result.failed}`,
    );
  });

  await boss.work(QUEUE_PM_MAINTAIN, async () => {
    const result = await maintainPmJobs();
    console.log(
      `[worker] pm.maintain → series=${result.series} created=${result.created} reminded=${result.reminded}`,
    );
  });

  await boss.work(QUEUE_GDPR_PURGE, async () => {
    const result = await purgeExpiredVerifiedTickets();
    console.log(
      `[worker] gdpr.purge → dryRun=${result.dryRun} candidates=${result.candidates} purged=${result.purged} attachments=${result.attachments} cutoff=${result.cutoff}`,
    );
  });

  try {
    await boss.schedule(QUEUE_SLA_CHECK, "*/5 * * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule sla:", (e as Error).message);
  }

  try {
    await boss.schedule(QUEUE_PM_MAINTAIN, "0 * * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule pm:", (e as Error).message);
  }

  try {
    // Soft-delete batch quotidiano 03:00 Europe/Rome (US-E12-01)
    await boss.schedule(QUEUE_GDPR_PURGE, "0 3 * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule gdpr:", (e as Error).message);
  }

  const imapConfig = readImapInboundConfig();
  if (imapConfig) {
    try {
      await boss.schedule(
        QUEUE_EMAIL_IMAP_POLL,
        imapConfig.pollCron,
        null,
        { tz: "Europe/Rome" },
      );
    } catch (e) {
      console.warn("[worker] schedule imap:", (e as Error).message);
    }
  } else {
    console.log("[worker] email.imap_poll schedule off (IMAP_HOST vuoto)");
  }

  console.log(
    "[worker] ready — queues:",
    QUEUE_EMAIL_SEND,
    QUEUE_SLA_CHECK,
    QUEUE_EMAIL_IMAP_POLL,
    QUEUE_PM_MAINTAIN,
    QUEUE_GDPR_PURGE,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
