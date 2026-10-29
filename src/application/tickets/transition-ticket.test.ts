import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { createVendor } from "@/domain/vendors/vendor-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { createTicket } from "./create-ticket";
import {
  assignTicket,
  cancelTicket,
  preferredVendorHint,
  triageTicket,
} from "./transition-ticket";

describe("transition-ticket", () => {
  let tenantId = "";
  let userId = "";
  const tenantIds: string[] = [];
  const emails: string[] = [];

  afterAll(async () => {
    for (const id of tenantIds) await cleanupTenant(id);
    for (const email of emails) {
      await prisma.session.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("triage → assign → timestamps + eventi; store deny; preferred hint", async () => {
    expect(
      preferredVendorHint({
        preferredVendorId: "v1",
        preferredVendor: { id: "v1", name: "Frigo SpA" },
      }),
    ).toEqual({ vendorId: "v1", vendorName: "Frigo SpA" });
    expect(preferredVendorHint(null)).toBeNull();

    const stamp = Date.now().toString(36);
    const email = `tr-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner Tr",
      email,
      password: "TestPass123!",
      workspaceName: `Tr ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    tenantIds.push(tenantId);
    userId = signup.userId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Tr", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: {
        name: "Vendor Frigo",
        email: `vendor-${stamp}@test.facilityflow.local`,
        trades: ["frigo"],
      },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const membership = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
    };

    const created = await createTicket({
      tenantId,
      actorUserId: userId,
      role: Role.owner,
      membership,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.critical,
        description: "Banco frigo caldo per triage",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const ticketId = created.ticket.id;

    const denyStore = await triageTicket({
      tenantId,
      ticketId,
      actorUserId: userId,
      role: Role.store_staff,
      note: "nope",
    });
    expect(denyStore.ok).toBe(false);

    const triaged = await triageTicket({
      tenantId,
      ticketId,
      actorUserId: userId,
      role: Role.ops_coordinator,
      note: "Priorità frigo",
    });
    expect(triaged.ok).toBe(true);
    if (!triaged.ok) return;
    expect(triaged.ticket.status).toBe(TicketStatus.triaged);
    expect(triaged.ticket.triagedAt).toBeTruthy();

    const assigned = await assignTicket({
      tenantId,
      ticketId,
      actorUserId: userId,
      role: Role.ops_coordinator,
      vendorId: vendor.vendor.id,
      priority: TicketPriority.high,
    });
    expect(assigned.ok).toBe(true);
    if (!assigned.ok) return;
    expect(assigned.ticket.status).toBe(TicketStatus.assigned);
    expect(assigned.ticket.vendorId).toBe(vendor.vendor.id);
    expect(assigned.ticket.assignedAt).toBeTruthy();
    expect(assigned.ticket.priority).toBe(TicketPriority.high);

    const events = await listTicketEvents(tenantId, ticketId);
    expect(events.some((e) => e.type === "ticket.triaged")).toBe(true);
    expect(events.some((e) => e.type === "ticket.assigned")).toBe(true);

    const notifications = await prisma.notification.findMany({
      where: { tenantId, ticketId },
    });
    expect(notifications.some((n) => n.type === "ticket.created")).toBe(true);
    expect(notifications.some((n) => n.type === "ticket.assigned")).toBe(false);
    // assign may have no vendor user membership yet — email still to Vendor.email

    const cancelled = await cancelTicket({
      tenantId,
      ticketId,
      actorUserId: userId,
      role: Role.owner,
      reason: "Falso allarme verificato",
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.ticket.status).toBe(TicketStatus.cancelled);
    expect(cancelled.ticket.cancelReason).toContain("Falso");
  });

  it("verified: transitionTicket rifiuta mutazioni (immutabilità applicativa)", async () => {
    const stamp = Date.now().toString(36);
    const email = `imm-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner Imm",
      email,
      password: "TestPass123!",
      workspaceName: `Imm ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    tenantIds.push(tenantId);
    userId = signup.userId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Imm", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: {
        name: "Vendor Imm",
        email: `v-imm-${stamp}@test.facilityflow.local`,
        trades: ["frigo"],
      },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const openedAt = new Date(Date.now() - 72 * 3600_000);
    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        storeId: store.store.id,
        vendorId: vendor.vendor.id,
        category: "frigo",
        priority: TicketPriority.normal,
        status: TicketStatus.verified,
        description: "Già verificato",
        openedAt,
        triagedAt: openedAt,
        assignedAt: openedAt,
        doneAt: new Date(openedAt.getTime() + 24 * 3600_000),
        verifiedAt: new Date(openedAt.getTime() + 48 * 3600_000),
        actualCost: 50,
        slaDueAt: new Date(openedAt.getTime() + 72 * 3600_000),
      },
    });

    const blocked = await assignTicket({
      tenantId,
      ticketId: ticket.id,
      actorUserId: userId,
      role: Role.ops_coordinator,
      vendorId: vendor.vendor.id,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.code).toBe("ticketImmutableVerified");
      expect(blocked.message).toBeUndefined();
    }

    const cancelled = await cancelTicket({
      tenantId,
      ticketId: ticket.id,
      actorUserId: userId,
      role: Role.owner,
      reason: "tentativo post-verified",
    });
    expect(cancelled.ok).toBe(false);

    const still = await prisma.ticket.findFirst({
      where: { id: ticket.id, tenantId },
    });
    expect(still?.status).toBe(TicketStatus.verified);
    expect(Number(still?.actualCost)).toBe(50);
  });
});
