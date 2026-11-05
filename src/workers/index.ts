/**
 * Worker Compose / locale: email outbox + sla + imap + pm + gdpr.purge + attachment.gc + rate_limit.gc.
 * Avvio: npm run worker
 */
import { PgBoss } from "pg-boss";
import { gcSoftDeletedAttachments } from "../application/attachments/gc-soft-deleted";
import {
  gcSentEmailOutbox,
  processEmailOutboxBatch,
} from "../application/email/dispatch-outbox";
import { pollImapInbound } from "../application/email-inbound/poll-imap";
import { purgeExpiredVerifiedTickets } from "../application/gdpr/purge-expired";
import { maintainPmJobs } from "../application/pm/maintain-pm";
import { gcExpiredRateLimitBuckets } from "../application/rate-limit/gc-expired-buckets";
import { checkSlaBreaches } from "../application/sla/check-breaches";
import { readImapInboundConfig } from "../infrastructure/email/imap-config";
import { openImapflowMailbox } from "../infrastructure/email/imapflow-mailbox";
import { gcAiInvocations } from "../application/ai/gc-ai-invocations";
import { indexTicketChunks } from "../application/ai/index-ticket-chunks";
import { runWeeklyHqDigest } from "../application/digest/weekly-hq-digest";
import {
  QUEUE_AI_INDEX_TICKET,
  QUEUE_AI_INVOCATION_GC,
  QUEUE_ATTACHMENT_GC,
  QUEUE_EMAIL_DIGEST_WEEKLY,
  QUEUE_EMAIL_IMAP_POLL,
  QUEUE_EMAIL_OUTBOX_DISPATCH,
  QUEUE_EMAIL_OUTBOX_GC,
  QUEUE_GDPR_PURGE,
  QUEUE_PM_MAINTAIN,
  QUEUE_RATE_LIMIT_GC,
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
  await boss.createQueue(QUEUE_EMAIL_OUTBOX_DISPATCH);
  await boss.createQueue(QUEUE_EMAIL_OUTBOX_GC);
  await boss.createQueue(QUEUE_EMAIL_DIGEST_WEEKLY);
  await boss.createQueue(QUEUE_SLA_CHECK);
  await boss.createQueue(QUEUE_EMAIL_IMAP_POLL);
  await boss.createQueue(QUEUE_PM_MAINTAIN);
  await boss.createQueue(QUEUE_GDPR_PURGE);
  await boss.createQueue(QUEUE_ATTACHMENT_GC);
  await boss.createQueue(QUEUE_RATE_LIMIT_GC);
  await boss.createQueue(QUEUE_AI_INDEX_TICKET);
  await boss.createQueue(QUEUE_AI_INVOCATION_GC);

  await boss.work(QUEUE_EMAIL_OUTBOX_DISPATCH, async () => {
    const result = await processEmailOutboxBatch(20);
    console.log(
      `[worker] email.outbox_dispatch → claimed=${result.claimed} sent=${result.sent} retried=${result.retried} dead=${result.dead}`,
    );
  });

  await boss.work(QUEUE_EMAIL_OUTBOX_GC, async () => {
    const result = await gcSentEmailOutbox(30);
    console.log(`[worker] email.outbox_gc → deleted=${result.deleted}`);
  });

  await boss.work(QUEUE_EMAIL_DIGEST_WEEKLY, async () => {
    const result = await runWeeklyHqDigest();
    console.log(
      `[worker] email.digest_weekly → tenants=${result.tenants} emails=${result.emails}`,
    );
  });

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

  await boss.work(QUEUE_ATTACHMENT_GC, async () => {
    const result = await gcSoftDeletedAttachments();
    console.log(
      `[worker] attachment.gc → dryRun=${result.dryRun} candidates=${result.candidates} purged=${result.purged} failed=${result.failed} cutoff=${result.cutoff}`,
    );
  });

  await boss.work(QUEUE_RATE_LIMIT_GC, async () => {
    const result = await gcExpiredRateLimitBuckets();
    console.log(
      `[worker] rate_limit.gc → dryRun=${result.dryRun} deleted=${result.deleted} cutoff=${result.cutoff}`,
    );
  });

  await boss.work(QUEUE_AI_INDEX_TICKET, async ([job]) => {
    const data = job.data as { tenantId?: string; ticketId?: string };
    if (!data?.tenantId || !data?.ticketId) {
      console.warn("[worker] ai.index_ticket skip — payload incompleto");
      return;
    }
    const result = await indexTicketChunks({
      tenantId: data.tenantId,
      ticketId: data.ticketId,
    });
    console.log(
      `[worker] ai.index_ticket → ticket=${data.ticketId} result=${JSON.stringify(result)}`,
    );
  });

  await boss.work(QUEUE_AI_INVOCATION_GC, async () => {
    const result = await gcAiInvocations();
    console.log(
      `[worker] ai.invocation_gc → dryRun=${result.dryRun} deleted=${result.deleted} cutoff=${result.cutoff}`,
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
    await boss.schedule(QUEUE_EMAIL_DIGEST_WEEKLY, "0 8 * * 1", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule digest:", (e as Error).message);
  }

  try {
    // F3-09 — poll outbox ogni 5s (cron secondi se supportato; fallback */1)
    await boss.schedule(QUEUE_EMAIL_OUTBOX_DISPATCH, "*/1 * * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule outbox:", (e as Error).message);
  }

  try {
    await boss.schedule(QUEUE_EMAIL_OUTBOX_GC, "0 5 * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule outbox.gc:", (e as Error).message);
  }

  try {
    await boss.schedule(QUEUE_PM_MAINTAIN, "0 * * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule pm:", (e as Error).message);
  }

  try {
    await boss.schedule(QUEUE_GDPR_PURGE, "0 3 * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule gdpr:", (e as Error).message);
  }

  try {
    await boss.schedule(QUEUE_ATTACHMENT_GC, "0 4 * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule attachment.gc:", (e as Error).message);
  }

  try {
    await boss.schedule(QUEUE_RATE_LIMIT_GC, "15 * * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule rate_limit.gc:", (e as Error).message);
  }

  try {
    await boss.schedule(QUEUE_AI_INVOCATION_GC, "30 4 * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule ai.invocation_gc:", (e as Error).message);
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
    QUEUE_EMAIL_OUTBOX_DISPATCH,
    QUEUE_EMAIL_OUTBOX_GC,
    QUEUE_SLA_CHECK,
    QUEUE_EMAIL_IMAP_POLL,
    QUEUE_PM_MAINTAIN,
    QUEUE_GDPR_PURGE,
    QUEUE_ATTACHMENT_GC,
    QUEUE_RATE_LIMIT_GC,
    QUEUE_AI_INDEX_TICKET,
    QUEUE_AI_INVOCATION_GC,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
