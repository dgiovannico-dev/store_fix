import { describe, expect, it } from "vitest";
import { emailIdempotencyKey } from "./idempotency";
import { enqueueEmail } from "./outbox";

describe("email idempotency (durable EmailOutbox)", () => {
  it("stessa chiave → secondo enqueue skipped", async () => {
    process.env.PGBOSS_DISABLED = "true";
    process.env.SMTP_TRANSPORT = "json";

    const ticketId = `T-idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const key = emailIdempotencyKey({
      template: "ticket_nuovo",
      ticketId,
      recipient: "ops@example.com",
    });
    expect(key).toContain(ticketId);

    const first = await enqueueEmail({
      to: "ops@example.com",
      template: "ticket_nuovo",
      vars: { ticketId, storeName: "PV" },
    });
    expect(first.sent).toBe(true);
    expect(first.skipped).toBe(false);

    const second = await enqueueEmail({
      to: "ops@example.com",
      template: "ticket_nuovo",
      vars: { ticketId, storeName: "PV" },
    });
    expect(second.sent).toBe(false);
    expect(second.skipped).toBe(true);
  });
});
