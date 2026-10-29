import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { createTicket, createTicketSchema } from "./create-ticket";

describe("createTicketSchema", () => {
  it("accetta solo INTAKE_CATEGORIES", () => {
    expect(
      createTicketSchema.safeParse({
        storeId: "s1",
        category: "frigo",
        priority: TicketPriority.normal,
        description: "Descrizione valida",
      }).success,
    ).toBe(true);
    expect(
      createTicketSchema.safeParse({
        storeId: "s1",
        category: "elettrico",
        priority: TicketPriority.normal,
        description: "Descrizione valida",
      }).success,
    ).toBe(false);
  });
});

describe("createTicket", () => {
  let tenantId = "";
  let userId = "";
  const emails: string[] = [];

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.session.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("crea open + slaDueAt + TicketEvent in transazione", async () => {
    const stamp = Date.now().toString(36);
    const email = `tk-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner Tk",
      email,
      password: "TestPass123!",
      workspaceName: `Tk ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    userId = signup.userId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Ticket", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const membership = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
    };

    const result = await createTicket({
      tenantId,
      actorUserId: userId,
      role: Role.owner,
      membership,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.critical,
        description: "Banco frigo caldo, temperatura >8C",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ticket.status).toBe(TicketStatus.open);
    expect(result.ticket.slaDueAt).toBeTruthy();

    const events = await listTicketEvents(tenantId, result.ticket.id);
    expect(events.some((e) => e.type === "ticket.created")).toBe(true);
    expect(events[0]?.toStatus).toBe(TicketStatus.open);
  });
});
