import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { confirmAttachmentUpload } from "@/application/attachments/confirm-upload";
import { createTicket } from "@/application/tickets/create-ticket";
import {
  assignTicket,
  triageTicket,
} from "@/application/tickets/transition-ticket";
import { NotificationType } from "@/domain/notification/types";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { assertTransition, IllegalTransitionError } from "@/domain/ticket/fsm";
import { createVendor } from "@/domain/vendors/vendor-service";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import {
  buildAttachmentKey,
  ensureBucket,
  putAttachmentObject,
} from "@/infrastructure/storage/s3";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

/**
 * T2.30 — Flusso A gate fino a `assigned` (application E2E).
 * Scenario: Frigo banco 2 non raffredda · critical · 2 foto.
 */
describe("Flusso A → assigned", () => {
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

  it("frigo critico: create → notify → triage → assign + 2 allegati + SLA ~4h", async () => {
    const stamp = Date.now().toString(36);
    const email = `flusso-a-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Ops FlussoA",
      email,
      password: "TestPass123!",
      workspaceName: `FlussoA ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Banco 2", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: {
        name: "Refrigerazione Italia",
        email: `vendor-fa-${stamp}@test.facilityflow.local`,
        trades: ["frigo"],
      },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const membership = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
      vendorId: null as string | null,
    };

    const created = await createTicket({
      tenantId,
      actorUserId: signup.userId,
      role: Role.owner,
      membership,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.critical,
        description: "Frigo banco 2 non raffredda",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const ticket = created.ticket;
    expect(ticket.status).toBe(TicketStatus.open);
    expect(ticket.slaDueAt).toBeTruthy();

    const openedAt = ticket.openedAt.getTime();
    const dueAt = ticket.slaDueAt!.getTime();
    const hours = (dueAt - openedAt) / (1000 * 60 * 60);
    expect(hours).toBeGreaterThan(3.5);
    expect(hours).toBeLessThan(4.5);

    const notifs = await prisma.notification.findMany({
      where: {
        tenantId,
        ticketId: ticket.id,
        type: NotificationType.ticketCreated,
      },
    });
    expect(notifs.length).toBeGreaterThan(0);

    expect(() =>
      assertTransition(
        TicketStatus.open,
        TicketStatus.assigned,
        Role.ops_coordinator,
      ),
    ).toThrow(IllegalTransitionError);

    let seaweedOk = true;
    try {
      await ensureBucket();
    } catch {
      seaweedOk = false;
    }

    for (const name of ["foto1.jpg", "foto2.jpg"] as const) {
      const key = buildAttachmentKey({
        tenantId,
        ticketId: ticket.id,
        filename: name,
      });
      const body = Buffer.from(`fake-jpeg-${name}-${stamp}`);
      if (seaweedOk) {
        try {
          await putAttachmentObject({
            key,
            body,
            mime: "image/jpeg",
          });
        } catch {
          seaweedOk = false;
        }
      }
      const conf = await confirmAttachmentUpload({
        tenantId,
        actorUserId: signup.userId,
        role: Role.owner,
        membership,
        data: {
          ticketId: ticket.id,
          storageKey: key,
          mime: "image/jpeg",
          sizeBytes: body.byteLength,
        },
      });
      expect(conf.ok).toBe(true);
    }

    const attachments = await prisma.attachment.findMany({
      where: { tenantId, ticketId: ticket.id, deletedAt: null },
    });
    expect(attachments).toHaveLength(2);

    const triaged = await triageTicket({
      tenantId,
      ticketId: ticket.id,
      actorUserId: signup.userId,
      role: Role.ops_coordinator,
      note: "Critico frigo — assign refrigerazione",
    });
    expect(triaged.ok).toBe(true);

    const assigned = await assignTicket({
      tenantId,
      ticketId: ticket.id,
      actorUserId: signup.userId,
      role: Role.ops_coordinator,
      vendorId: vendor.vendor.id,
    });
    expect(assigned.ok).toBe(true);
    if (!assigned.ok) return;
    expect(assigned.ticket.status).toBe(TicketStatus.assigned);
    expect(assigned.ticket.vendorId).toBe(vendor.vendor.id);
    expect(assigned.ticket.assignedAt).toBeTruthy();

    const events = await listTicketEvents(tenantId, ticket.id);
    expect(events.some((e) => e.type === "ticket.created")).toBe(true);
    expect(events.some((e) => e.type === "ticket.triaged")).toBe(true);
    expect(events.some((e) => e.type === "ticket.assigned")).toBe(true);

    // Stop a assigned — path vendor in_progress fuori scope S2
    expect(assigned.ticket.status).not.toBe(TicketStatus.in_progress);
  }, 30_000);
});
