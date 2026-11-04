import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";
import { appendEmailOutbox, enqueueEmail } from "./outbox";
import { processEmailOutboxBatch } from "@/application/email/dispatch-outbox";
import { emailIdempotencyKey } from "./idempotency";
import { cleanupEmailOutboxByKeyPrefix } from "@/test-utils/cleanup-tenant";

const KEY_PREFIXES = [
  "test-rollback:",
  "test-dup:",
  "test-dead:",
  "test-stuck:",
  "ticket_nuovo:T-disp-",
];

describe("EmailOutbox F3-09", () => {
  beforeAll(() => {
    process.env.PGBOSS_DISABLED = "true";
    process.env.SMTP_TRANSPORT = "json";
  });

  afterAll(async () => {
    for (const p of KEY_PREFIXES) {
      await cleanupEmailOutboxByKeyPrefix(p);
    }
  });

  it("append + rollback → zero rows", async () => {
    const key = `test-rollback:${Date.now()}:${Math.random()}`;
    await expect(
      prisma.$transaction(async (tx) => {
        await appendEmailOutbox(tx, {
          to: "rollback@example.com",
          template: "ticket_nuovo",
          vars: { ticketId: "T-roll", storeName: "PV" },
          idempotencyKey: key,
        });
        throw new Error("force_rollback");
      }),
    ).rejects.toThrow("force_rollback");

    const row = await prisma.emailOutbox.findUnique({
      where: { idempotencyKey: key },
    });
    expect(row).toBeNull();
  });

  it("double append stessa key → una riga, secondo skipped", async () => {
    const key = `test-dup:${Date.now()}:${Math.random()}`;
    const first = await appendEmailOutbox(prisma, {
      to: "dup@example.com",
      template: "ticket_nuovo",
      vars: { ticketId: "T-dup", storeName: "PV" },
      idempotencyKey: key,
    });
    expect(first.skipped).toBe(false);

    const second = await appendEmailOutbox(prisma, {
      to: "dup@example.com",
      template: "ticket_nuovo",
      vars: { ticketId: "T-dup", storeName: "PV" },
      idempotencyKey: key,
    });
    expect(second.skipped).toBe(true);
    expect(second.id).toBe(first.id);

    const count = await prisma.emailOutbox.count({
      where: { idempotencyKey: key },
    });
    expect(count).toBe(1);
  });

  it("dispatcher PENDING → SENT; secondo enqueue skipped", async () => {
    const ticketId = `T-disp-${Date.now()}`;
    const key = emailIdempotencyKey({
      template: "ticket_nuovo",
      ticketId,
      recipient: "ops-disp@example.com",
    });

    const first = await enqueueEmail({
      to: "ops-disp@example.com",
      template: "ticket_nuovo",
      vars: { ticketId, storeName: "PV" },
    });
    expect(first.sent).toBe(true);
    expect(first.skipped).toBe(false);

    const pending = await prisma.emailOutbox.findUniqueOrThrow({
      where: { idempotencyKey: key },
    });
    if (pending.status !== "sent") {
      const r = await processEmailOutboxBatch(5, { onlyIds: [pending.id] });
      expect(r.claimed).toBe(1);
      expect(r.sent).toBe(1);
    }

    const row = await prisma.emailOutbox.findUnique({
      where: { idempotencyKey: key },
    });
    expect(row?.status).toBe("sent");

    const second = await enqueueEmail({
      to: "ops-disp@example.com",
      template: "ticket_nuovo",
      vars: { ticketId, storeName: "PV" },
    });
    expect(second.sent).toBe(false);
    expect(second.skipped).toBe(true);
  });

  it("DEAD after max attempts", async () => {
    const key = `test-dead:${Date.now()}:${Math.random()}`;
    const row = await prisma.emailOutbox.create({
      data: {
        toAddr: "dead@example.com",
        subject: "dead",
        textBody: "body",
        template: "ticket_nuovo",
        idempotencyKey: key,
        status: "pending",
        attempts: 7,
        nextAttemptAt: new Date(Date.now() - 1000),
      },
    });

    const result = await processEmailOutboxBatch(5, {
      onlyIds: [row.id],
      send: async () => {
        throw new Error("smtp_down");
      },
    });
    expect(result.claimed).toBe(1);
    expect(result.dead).toBe(1);

    const after = await prisma.emailOutbox.findUnique({
      where: { idempotencyKey: key },
    });
    expect(after?.status).toBe("dead");
    expect(after?.attempts).toBeGreaterThanOrEqual(8);
  });

  it("stuck PROCESSING reclaim → SENT once", async () => {
    const key = `test-stuck:${Date.now()}:${Math.random()}`;
    const row = await prisma.emailOutbox.create({
      data: {
        toAddr: "stuck@example.com",
        subject: "stuck",
        textBody: "body",
        template: "ticket_nuovo",
        idempotencyKey: key,
        status: "processing",
        attempts: 1,
        lockedAt: new Date(Date.now() - 10 * 60_000),
        lockToken: "stale-token",
        nextAttemptAt: new Date(Date.now() - 60_000),
      },
    });

    const result = await processEmailOutboxBatch(5, { onlyIds: [row.id] });
    expect(result.claimed).toBe(1);
    expect(result.sent).toBe(1);

    const after = await prisma.emailOutbox.findUnique({ where: { id: row.id } });
    expect(after?.status).toBe("sent");
    expect(after?.lockToken).toBeNull();
  });
});
