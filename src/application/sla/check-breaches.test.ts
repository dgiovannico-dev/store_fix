import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createTicket } from "@/application/tickets/create-ticket";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/application/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { NotificationType } from "@/domain/notification/types";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { checkSlaBreaches } from "./check-breaches";

describe("checkSlaBreaches", () => {
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

  it("marca breach una sola volta (idempotente)", async () => {
    const stamp = Date.now().toString(36);
    const email = `br-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner Br",
      email,
      password: "TestPass123!",
      workspaceName: `Br ${stamp}`,
    });
    expect(signup).toMatchObject({ ok: true });
    if (!signup.ok) throw new Error("signup failed");
    tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Br", timezone: "Europe/Rome" },
    });
    expect(store).toMatchObject({ ok: true });
    if (!store.ok) throw new Error("createStore failed");

    const created = await createTicket({
      tenantId,
      actorUserId: signup.userId,
      role: Role.owner,
      membership: {
        role: Role.owner,
        storeIds: [],
        deletedAt: null,
      },
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.critical,
        description: "Ticket per breach SLA test",
      },
    });
    expect(created).toMatchObject({ ok: true });
    if (!created.ok) throw new Error("createTicket failed");

    await prisma.ticket.update({
      where: { id: created.ticket.id },
      data: {
        slaDueAt: new Date(Date.now() - 60_000),
        status: TicketStatus.assigned,
      },
    });

    const first = await checkSlaBreaches();
    expect(first.breached).toBeGreaterThanOrEqual(1);

    const row = await prisma.ticket.findFirstOrThrow({
      where: { id: created.ticket.id },
    });
    expect(row.slaBreachedAt).toBeTruthy();
    const stampedAt = row.slaBreachedAt!.getTime();

    const notifs = await prisma.notification.count({
      where: {
        tenantId,
        ticketId: created.ticket.id,
        type: NotificationType.ticketBreached,
      },
    });
    expect(notifs).toBeGreaterThan(0);

    // Idempotency is per-ticket (global breached count may include siblings)
    await checkSlaBreaches();
    const row2 = await prisma.ticket.findFirstOrThrow({
      where: { id: created.ticket.id },
    });
    expect(row2.slaBreachedAt!.getTime()).toBe(stampedAt);
    const notifs2 = await prisma.notification.count({
      where: {
        tenantId,
        ticketId: created.ticket.id,
        type: NotificationType.ticketBreached,
      },
    });
    expect(notifs2).toBe(notifs);
  });
});

