import { PgBoss } from "pg-boss";

export const QUEUE_EMAIL_SEND = "email.send";
export const QUEUE_SLA_CHECK = "sla.check_breaches";
export const QUEUE_EMAIL_IMAP_POLL = "email.imap_poll";

let bossSingleton: PgBoss | null = null;
let starting: Promise<PgBoss | null> | null = null;

/**
 * Returns started PgBoss, or null if DATABASE_URL missing / PGBOSS_DISABLED=true
 * (unit tests / inline email).
 */
export async function getBoss(): Promise<PgBoss | null> {
  if (process.env.PGBOSS_DISABLED === "true") return null;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (bossSingleton) return bossSingleton;
  if (starting) return starting;

  starting = (async () => {
    const boss = new PgBoss({ connectionString: url });
    boss.on("error", (err) => {
      console.error("[pg-boss]", err);
    });
    await boss.start();
    await boss.createQueue(QUEUE_EMAIL_SEND);
    await boss.createQueue(QUEUE_SLA_CHECK);
    await boss.createQueue(QUEUE_EMAIL_IMAP_POLL);
    bossSingleton = boss;
    return boss;
  })();

  return starting;
}

export async function stopBoss(): Promise<void> {
  if (bossSingleton) {
    await bossSingleton.stop({ graceful: true, timeout: 5000 });
    bossSingleton = null;
  }
  starting = null;
}
