import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createTicket } from "@/application/tickets/create-ticket";
import { TicketEventType } from "@/domain/ticket/event-types";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  purgeExpiredVerifiedTickets,
  retentionCutoff,
} from "./purge-expired";

describe("purgeExpiredVerifiedTickets", () => {
  let tenantId = "";
  const emails: string[] = [];

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.session.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("soft-delete verified oltre cutoff; lascia i recenti; idempotente", async () => {
    const stamp = Date.now().toString(36);
    const email = `gdpr-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner Gdpr",
      email,
      password: "TestPass123!",
      workspaceName: `Gdpr ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Gdpr", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const membership = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
    };

    const oldTicket = await createTicket({
      tenantId,
      actorUserId: signup.userId,
      role: Role.owner,
      membership,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.normal,
        description: "Verified vecchio da purge",
      },
    });
    expect(oldTicket.ok).toBe(true);
    if (!oldTicket.ok) return;

    const freshTicket = await createTicket({
      tenantId,
      actorUserId: signup.userId,
      role: Role.owner,
      membership,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.normal,
        description: "Verified recente",
      },
    });
    expect(freshTicket.ok).toBe(true);
    if (!freshTicket.ok) return;

    const now = new Date("2026-10-29T12:00:00.000Z");
    const oldVerifiedAt = retentionCutoff(now, 25);
    const recentVerifiedAt = retentionCutoff(now, 6);

    await prisma.ticket.update({
      where: { id: oldTicket.ticket.id },
      data: {
        status: TicketStatus.verified,
        verifiedAt: oldVerifiedAt,
      },
    });
    await prisma.attachment.create({
      data: {
        tenantId,
        ticketId: oldTicket.ticket.id,
        storageKey: `test/${oldTicket.ticket.id}/a.jpg`,
        mime: "image/jpeg",
        sizeBytes: 100,
      },
    });

    await prisma.ticket.update({
      where: { id: freshTicket.ticket.id },
      data: {
        status: TicketStatus.verified,
        verifiedAt: recentVerifiedAt,
      },
    });

    const dry = await purgeExpiredVerifiedTickets({
      now,
      dryRun: true,
    });
    expect(dry.dryRun).toBe(true);
    expect(dry.candidates).toBeGreaterThanOrEqual(1);
    expect(dry.purged).toBe(0);

    const first = await purgeExpiredVerifiedTickets({ now });
    expect(first.purged).toBeGreaterThanOrEqual(1);
    expect(first.attachments).toBeGreaterThanOrEqual(1);

    const oldRow = await prisma.ticket.findFirstOrThrow({
      where: { id: oldTicket.ticket.id },
    });
    expect(oldRow.deletedAt).toBeTruthy();

    const freshRow = await prisma.ticket.findFirstOrThrow({
      where: { id: freshTicket.ticket.id },
    });
    expect(freshRow.deletedAt).toBeNull();

    const att = await prisma.attachment.findFirstOrThrow({
      where: { ticketId: oldTicket.ticket.id },
    });
    expect(att.deletedAt).toBeTruthy();

    const evt = await prisma.ticketEvent.findFirst({
      where: {
        ticketId: oldTicket.ticket.id,
        type: TicketEventType.gdprRetentionPurge,
      },
    });
    expect(evt).toBeTruthy();

    const second = await purgeExpiredVerifiedTickets({ now });
    expect(second.purged).toBe(0);
  });
});
