import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it, vi } from "vitest";
import { emitTicketNotification } from "@/application/notifications/emit";
import { createTicket } from "@/application/tickets/create-ticket";
import { NotificationType } from "@/domain/notification/types";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

describe("emitTicketNotification", () => {
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

  it("created → HQ in-app + store webhook push", async () => {
    const stamp = Date.now().toString(36);
    const email = `emit-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner Emit",
      email,
      password: "TestPass123!",
      workspaceName: `Emit ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantIds.push(signup.tenantId);
    const tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: {
        name: "PV Emit",
        timezone: "Europe/Rome",
        webhookUrl: "https://hooks.test.facilityflow.local/ff",
      },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const fetchImpl = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true } as Response);

    try {
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
          priority: TicketPriority.normal,
          description: "Emit orchestration test ticket",
        },
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const notifs = await prisma.notification.findMany({
        where: {
          tenantId,
          ticketId: created.ticket.id,
          type: NotificationType.ticketCreated,
        },
      });
      expect(notifs.length).toBeGreaterThanOrEqual(1);
      expect(notifs.some((n) => n.userId === signup.userId)).toBe(true);

      expect(fetchImpl).toHaveBeenCalled();
      const webhookCall = fetchImpl.mock.calls.find(
        (c) => c[0] === "https://hooks.test.facilityflow.local/ff",
      );
      expect(webhookCall).toBeTruthy();
    } finally {
      fetchImpl.mockRestore();
    }
  });

  it("assigned → vendor notification type", async () => {
    const stamp = Date.now().toString(36);
    const ownerEmail = `emit-asg-o-${stamp}@test.facilityflow.local`;
    const vendorEmail = `emit-asg-v-${stamp}@test.facilityflow.local`;
    emails.push(ownerEmail, vendorEmail);

    const signup = await signupHqOwner({
      name: "Owner Asg",
      email: ownerEmail,
      password: "TestPass123!",
      workspaceName: `Emit Asg ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantIds.push(signup.tenantId);
    const tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Asg", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await prisma.vendor.create({
      data: {
        tenantId,
        name: "Vendor Emit",
        email: vendorEmail,
        storeCoverageIds: [store.store.id],
        trades: ["frigo"],
      },
    });

    const vendorUser = await prisma.user.create({
      data: {
        email: vendorEmail,
        name: "Vendor User",
        passwordHash: "x",
        emailVerified: new Date(),
      },
    });
    await prisma.membership.create({
      data: {
        tenantId,
        userId: vendorUser.id,
        role: Role.vendor,
        vendorId: vendor.id,
        storeIds: [],
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.normal,
        status: TicketStatus.assigned,
        description: "Assign emit test",
        vendorId: vendor.id,
      },
      include: { store: true, vendor: true },
    });

    await emitTicketNotification({
      kind: "assigned",
      tenantId,
      ticket,
      actorUserId: signup.userId,
    });

    const notifs = await prisma.notification.findMany({
      where: {
        tenantId,
        ticketId: ticket.id,
        type: NotificationType.ticketAssigned,
      },
    });
    expect(notifs.some((n) => n.userId === vendorUser.id)).toBe(true);
  });
});
