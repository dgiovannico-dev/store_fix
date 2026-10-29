import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createTicket } from "@/application/tickets/create-ticket";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
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
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Br", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

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
    expect(created.ok).toBe(true);
    if (!created.ok) return;

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

    const notifs = await prisma.notification.count({
      where: {
        tenantId,
        ticketId: created.ticket.id,
        type: NotificationType.ticketBreached,
      },
    });
    expect(notifs).toBeGreaterThan(0);

    const second = await checkSlaBreaches();
    expect(second.breached).toBe(0);
  });
});
