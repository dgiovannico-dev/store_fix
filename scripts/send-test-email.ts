/**
 * Invia email di prova (inline, senza worker).
 * Richiede Mailpit: docker compose --profile dev up -d mailpit
 */
import { enqueueEmail } from "../src/infrastructure/email/outbox";

async function main() {
  process.env.PGBOSS_DISABLED = "true";
  await enqueueEmail({
    to: "qa@demo.facilityflow.local",
    template: "ticket_nuovo",
    vars: {
      ticketId: "DEMO-1",
      storeName: "PV Demo",
      summary: "Email di prova scaffold S1",
    },
  });
  console.log("Email inviata — apri Mailpit http://localhost:8025");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
