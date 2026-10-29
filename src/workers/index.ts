/**
 * Worker Compose / locale: consuma email.send + sla.check_breaches.
 * Avvio: npm run worker
 */
import { PgBoss } from "pg-boss";
import { checkSlaBreaches } from "../application/sla/check-breaches";
import { sendEmail } from "../infrastructure/email/mailer";
import {
  QUEUE_EMAIL_SEND,
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

  try {
    await boss.schedule(QUEUE_SLA_CHECK, "*/5 * * * *", null, {
      tz: "Europe/Rome",
    });
  } catch (e) {
    console.warn("[worker] schedule sla:", (e as Error).message);
  }

  console.log("[worker] ready — queues:", QUEUE_EMAIL_SEND, QUEUE_SLA_CHECK);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
