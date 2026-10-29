/**
 * Enqueue email.send via pg-boss; worker must be running.
 * Usage: npm run worker & ; npx tsx scripts/smoke-worker-email.ts
 */
async function main() {
  const { enqueueEmail } = await import("../src/infrastructure/email/outbox");
  const { stopBoss } = await import("../src/infrastructure/jobs/boss");
  await enqueueEmail({
    to: "worker-test@facilityflow.local",
    template: "ticket_nuovo",
    vars: { ticketId: "TK-WORKER", storeName: "Demo" },
  });
  console.log("Job email.send enqueued — check worker logs + Mailpit");
  await stopBoss();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
