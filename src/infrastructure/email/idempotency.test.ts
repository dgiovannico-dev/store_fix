import { beforeEach, describe, expect, it } from "vitest";
import {
  _resetEmailIdempotencyForTests,
  claimEmailIdempotency,
  emailIdempotencyKey,
} from "./idempotency";
import { enqueueEmail } from "./outbox";

describe("email idempotency", () => {
  beforeEach(() => {
    _resetEmailIdempotencyForTests();
    process.env.PGBOSS_DISABLED = "true";
  });

  it("stessa chiave → secondo enqueue skipped", async () => {
    const key = emailIdempotencyKey({
      template: "ticket_nuovo",
      ticketId: "T1",
      recipient: "ops@example.com",
    });
    expect(claimEmailIdempotency(key)).toBe(true);
    expect(claimEmailIdempotency(key)).toBe(false);

    _resetEmailIdempotencyForTests();
    const first = await enqueueEmail({
      to: "ops@example.com",
      template: "ticket_nuovo",
      vars: { ticketId: "T1", storeName: "PV" },
    });
    expect(first.sent).toBe(true);
    expect(first.skipped).toBe(false);

    const second = await enqueueEmail({
      to: "ops@example.com",
      template: "ticket_nuovo",
      vars: { ticketId: "T1", storeName: "PV" },
    });
    expect(second.sent).toBe(false);
    expect(second.skipped).toBe(true);
  });
});
