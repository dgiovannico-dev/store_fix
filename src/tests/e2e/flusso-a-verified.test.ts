import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { confirmAttachmentUpload } from "@/application/attachments/confirm-upload";
import { createTicket } from "@/application/tickets/create-ticket";
import {
  assignTicket,
  triageTicket,
} from "@/application/tickets/transition-ticket";
import {
  completeVendorWork,
  transitionVendorStatus,
} from "@/application/tickets/vendor-ticket-lifecycle";
import { verifyTicket } from "@/application/tickets/verify-ticket";
import { acceptInvite, createInvite } from "@/domain/invites/invite";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { assertTransition, IllegalTransitionError } from "@/domain/ticket/fsm";
import { createVendor } from "@/domain/vendors/vendor-service";
import { listTicketEvents } from "@/infrastructure/db/ticket-event-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { buildAttachmentKey } from "@/infrastructure/storage/s3";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

/** T3.13 — Flusso A completo fino a verified. */
describe("Flusso A → verified", () => {
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

  it("path completo assigned→in_progress→done→verified", async () => {
    const stamp = Date.now().toString(36);
    const email = `fa2-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Ops FA2",
      email,
      password: "TestPass123!",
      workspaceName: `FA2 ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV FA2", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: {
        name: "Frigo FA2",
        email: `vfa2-${stamp}@test.facilityflow.local`,
        trades: ["frigo"],
      },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const vEmail = `vu-fa2-${stamp}@test.facilityflow.local`;
    emails.push(vEmail);
    const inv = await createInvite({
      tenantId,
      actorRole: Role.owner,
      actorUserId: signup.userId,
      email: vEmail,
      role: Role.vendor,
      vendorId: vendor.vendor.id,
    });
    expect(inv.ok).toBe(true);
    if (!inv.ok) return;
    await acceptInvite({
      rawToken: inv.acceptUrl.split("/invite/")[1]!,
      name: "Vendor FA2",
      password: "VendorPass123!",
    });
    const vMem = await prisma.membership.findFirst({
      where: { tenantId, user: { email: vEmail } },
    });
    expect(vMem).toBeTruthy();
    if (!vMem) return;

    const hq = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
    };

    const created = await createTicket({
      tenantId,
      actorUserId: signup.userId,
      role: Role.owner,
      membership: hq,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.critical,
        description: "Frigo banco 2 non raffredda",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const ticketId = created.ticket.id;

    expect(() =>
      assertTransition(
        TicketStatus.open,
        TicketStatus.assigned,
        Role.ops_coordinator,
      ),
    ).toThrow(IllegalTransitionError);

    await triageTicket({
      tenantId,
      ticketId,
      actorUserId: signup.userId,
      role: Role.ops_coordinator,
    });
    await assignTicket({
      tenantId,
      ticketId,
      actorUserId: signup.userId,
      role: Role.ops_coordinator,
      vendorId: vendor.vendor.id,
    });

    await transitionVendorStatus({
      tenantId,
      ticketId,
      actorUserId: vMem.userId,
      role: Role.vendor,
      membership: vMem,
      to: TicketStatus.in_progress,
    });

    for (const name of ["a.jpg", "b.jpg"] as const) {
      const key = buildAttachmentKey({ tenantId, ticketId, filename: name });
      await confirmAttachmentUpload({
        tenantId,
        actorUserId: vMem.userId,
        role: Role.vendor,
        membership: vMem,
        data: {
          ticketId,
          storageKey: key,
          mime: "image/jpeg",
          sizeBytes: 100,
        },
      });
    }

    const done = await completeVendorWork({
      tenantId,
      ticketId,
      actorUserId: vMem.userId,
      role: Role.vendor,
      membership: vMem,
      data: {
        actualCost: 220,
        completionReport: "Compressore ok dopo intervento",
      },
    });
    expect(done.ok).toBe(true);

    const verified = await verifyTicket({
      tenantId,
      ticketId,
      actorUserId: signup.userId,
      role: Role.owner,
      membership: hq,
    });
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;
    expect(verified.ticket.status).toBe(TicketStatus.verified);

    const events = await listTicketEvents(tenantId, ticketId);
    expect(events.some((e) => e.type === "verified")).toBe(true);
  }, 60_000);
});
