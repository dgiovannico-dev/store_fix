import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { checkSlaBreaches } from "@/application/sla/check-breaches";
import { relaunchSlaTicket } from "@/application/sla/relaunch";
import { createTicket } from "@/application/tickets/create-ticket";
import { NotificationType } from "@/domain/notification/types";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { TicketEventType } from "@/domain/ticket/event-types";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

/** T3.14 — Flusso B breach + rilancio. */
describe("Flusso B breach", () => {
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

  it("breach idempotente + relaunch evento", async () => {
    const stamp = Date.now().toString(36);
    const email = `fb-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Ops FB",
      email,
      password: "TestPass123!",
      workspaceName: `FB ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV FB", timezone: "Europe/Rome" },
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
        description: "Ticket Flusso B breach",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await prisma.ticket.update({
      where: { id: created.ticket.id },
      data: {
        slaDueAt: new Date(Date.now() - 120_000),
        status: TicketStatus.assigned,
      },
    });

    // Assert tenant-scoped: parallel e2e possono creare altri breach sullo stesso DB.
    expect((await checkSlaBreaches()).breached).toBeGreaterThanOrEqual(1);
    const afterBreach = await prisma.ticket.findFirstOrThrow({
      where: { id: created.ticket.id, tenantId },
    });
    expect(afterBreach.slaBreachedAt).not.toBeNull();

    await checkSlaBreaches();
    await checkSlaBreaches();
    const eventsAfterIdempotent = await listTicketEvents(
      tenantId,
      created.ticket.id,
    );
    expect(
      eventsAfterIdempotent.filter(
        (e) => e.type === TicketEventType.slaBreached,
      ),
    ).toHaveLength(1);

    const breachNotifs = await prisma.notification.count({
      where: {
        tenantId,
        ticketId: created.ticket.id,
        type: NotificationType.ticketBreached,
      },
    });
    expect(breachNotifs).toBeGreaterThan(0);

    const relaunch = await relaunchSlaTicket({
      tenantId,
      ticketId: created.ticket.id,
      actorUserId: signup.userId,
      role: Role.ops_coordinator,
      note: "Chiamare vendor urgentemente",
    });
    expect(relaunch.ok).toBe(true);

    const events = await listTicketEvents(tenantId, created.ticket.id);
    expect(events.some((e) => e.type === TicketEventType.slaBreached)).toBe(
      true,
    );
    expect(events.some((e) => e.type === TicketEventType.slaRelaunch)).toBe(
      true,
    );
  });
});
