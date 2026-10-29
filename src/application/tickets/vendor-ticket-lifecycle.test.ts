import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { confirmAttachmentUpload } from "@/application/attachments/confirm-upload";
import { createTicket } from "@/application/tickets/create-ticket";
import {
  assignTicket,
  triageTicket,
} from "@/application/tickets/transition-ticket";
import { rejectTicket, verifyTicket } from "@/application/tickets/verify-ticket";
import { acceptInvite, createInvite } from "@/domain/invites/invite";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { createVendor } from "@/domain/vendors/vendor-service";
import { prisma } from "@/infrastructure/db/prisma";
import { buildAttachmentKey } from "@/infrastructure/storage/s3";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  completeVendorWork,
  transitionVendorStatus,
} from "./vendor-ticket-lifecycle";

describe("vendor lifecycle + verify", () => {
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

  it("in_progress → done (foto+costo) → reject → verify", async () => {
    const stamp = Date.now().toString(36);
    const ownerEmail = `vl-o-${stamp}@test.facilityflow.local`;
    emails.push(ownerEmail);
    const signup = await signupHqOwner({
      name: "Owner VL",
      email: ownerEmail,
      password: "TestPass123!",
      workspaceName: `VL ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV VL", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: {
        name: "Tech VL",
        email: `vl-v-${stamp}@test.facilityflow.local`,
        trades: ["frigo"],
      },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const vEmail = `vl-user-${stamp}@test.facilityflow.local`;
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
      name: "Vendor User",
      password: "VendorPass123!",
    });
    const vMem = await prisma.membership.findFirst({
      where: { tenantId, user: { email: vEmail } },
    });
    expect(vMem?.vendorId).toBe(vendor.vendor.id);
    if (!vMem) return;

    const hqMem = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
      vendorId: null as string | null,
    };
    const created = await createTicket({
      tenantId,
      actorUserId: signup.userId,
      role: Role.owner,
      membership: hqMem,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.high,
        description: "Vendor lifecycle test ticket",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const ticketId = created.ticket.id;

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

    const denyStaff = await transitionVendorStatus({
      tenantId,
      ticketId,
      actorUserId: signup.userId,
      role: Role.store_staff,
      membership: {
        role: Role.store_staff,
        storeIds: [store.store.id],
        deletedAt: null,
        vendorId: null,
      },
      to: TicketStatus.in_progress,
    });
    expect(denyStaff.ok).toBe(false);

    const started = await transitionVendorStatus({
      tenantId,
      ticketId,
      actorUserId: vMem.userId,
      role: Role.vendor,
      membership: vMem,
      to: TicketStatus.in_progress,
    });
    expect(started.ok).toBe(true);

    const failDone = await completeVendorWork({
      tenantId,
      ticketId,
      actorUserId: vMem.userId,
      role: Role.vendor,
      membership: vMem,
      data: {
        actualCost: 80,
        completionReport: "Senza foto non deve passare",
      },
    });
    expect(failDone.ok).toBe(false);

    const key = buildAttachmentKey({
      tenantId,
      ticketId,
      filename: "close.jpg",
    });
    const attach = await confirmAttachmentUpload({
      tenantId,
      actorUserId: vMem.userId,
      role: Role.vendor,
      membership: vMem,
      data: {
        ticketId,
        storageKey: key,
        mime: "image/jpeg",
        sizeBytes: 200,
      },
    });
    expect(attach.ok).toBe(true);

    const done = await completeVendorWork({
      tenantId,
      ticketId,
      actorUserId: vMem.userId,
      role: Role.vendor,
      membership: vMem,
      data: {
        actualCost: 95.5,
        completionReport: "Compressore sostituito e testato",
      },
    });
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    expect(done.ticket.status).toBe(TicketStatus.done);
    expect(Number(done.ticket.actualCost)).toBeCloseTo(95.5);

    const rejected = await rejectTicket({
      tenantId,
      ticketId,
      actorUserId: signup.userId,
      role: Role.owner,
      membership: hqMem,
      reason: "Ancora caldo al banco",
    });
    expect(rejected.ok).toBe(true);
    if (!rejected.ok) return;
    expect(rejected.ticket.status).toBe(TicketStatus.in_progress);

    const reDone = await completeVendorWork({
      tenantId,
      ticketId,
      actorUserId: vMem.userId,
      role: Role.vendor,
      membership: vMem,
      data: {
        actualCost: 110,
        completionReport: "Secondo intervento ok",
      },
    });
    expect(reDone.ok).toBe(true);

    const verified = await verifyTicket({
      tenantId,
      ticketId,
      actorUserId: signup.userId,
      role: Role.owner,
      membership: hqMem,
    });
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;
    expect(verified.ticket.status).toBe(TicketStatus.verified);
  }, 45_000);
});
