import { Role, TicketPriority } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { confirmAttachmentUpload } from "@/application/attachments/confirm-upload";
import { createTicket } from "@/application/tickets/create-ticket";
import { listTicketsForMembership } from "@/application/tickets/list-tickets";
import {
  assignTicket,
  triageTicket,
} from "@/application/tickets/transition-ticket";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { createVendor } from "@/domain/vendors/vendor-service";
import { prisma } from "@/infrastructure/db/prisma";
import { buildAttachmentKey } from "@/infrastructure/storage/s3";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

/** T2.28 — tenant A non legge/modifica ticket/allegati di B. */
describe("ticket/attachment cross-tenant isolation", () => {
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

  it("deny lista, transition, confirm attach cross-tenant", async () => {
    const stamp = Date.now().toString(36);
    const emailA = `tk-iso-a-${stamp}@test.facilityflow.local`;
    const emailB = `tk-iso-b-${stamp}@test.facilityflow.local`;
    emails.push(emailA, emailB);

    const a = await signupHqOwner({
      name: "Owner IsoA",
      email: emailA,
      password: "TestPass123!",
      workspaceName: `TkIsoA ${stamp}`,
    });
    const b = await signupHqOwner({
      name: "Owner IsoB",
      email: emailB,
      password: "TestPass123!",
      workspaceName: `TkIsoB ${stamp}`,
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    tenantIds.push(a.tenantId, b.tenantId);
    await ensureDefaultSlaPolicies(prisma, a.tenantId);
    await ensureDefaultSlaPolicies(prisma, b.tenantId);

    const storeA = await createStore({
      tenantId: a.tenantId,
      role: Role.owner,
      data: { name: "PV A", timezone: "Europe/Rome" },
    });
    expect(storeA.ok).toBe(true);
    if (!storeA.ok) return;

    const memA = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
      vendorId: null as string | null,
    };

    const created = await createTicket({
      tenantId: a.tenantId,
      actorUserId: a.userId,
      role: Role.owner,
      membership: memA,
      data: {
        storeId: storeA.store.id,
        category: "frigo",
        priority: TicketPriority.critical,
        description: "Ticket solo tenant A isolation",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const ticketId = created.ticket.id;

    const memB = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
      vendorId: null as string | null,
    };

    const listB = await listTicketsForMembership({
      tenantId: b.tenantId,
      role: Role.owner,
      membership: memB,
    });
    expect(listB.find((t) => t.id === ticketId)).toBeUndefined();

    const directB = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId: b.tenantId },
    });
    expect(directB).toBeNull();

    const triageB = await triageTicket({
      tenantId: b.tenantId,
      ticketId,
      actorUserId: b.userId,
      role: Role.ops_coordinator,
    });
    expect(triageB.ok).toBe(false);

    const vendorB = await createVendor({
      tenantId: b.tenantId,
      role: Role.owner,
      data: { name: "Vendor B", email: `vb-${stamp}@test.facilityflow.local` },
    });
    expect(vendorB.ok).toBe(true);
    if (!vendorB.ok) return;

    const assignB = await assignTicket({
      tenantId: b.tenantId,
      ticketId,
      actorUserId: b.userId,
      role: Role.ops_coordinator,
      vendorId: vendorB.vendor.id,
    });
    expect(assignB.ok).toBe(false);

    const fakeKey = buildAttachmentKey({
      tenantId: b.tenantId,
      ticketId,
      filename: "x.jpg",
    });
    const attachB = await confirmAttachmentUpload({
      tenantId: b.tenantId,
      actorUserId: b.userId,
      role: Role.owner,
      membership: memB,
      data: {
        ticketId,
        storageKey: fakeKey,
        mime: "image/jpeg",
        sizeBytes: 100,
      },
    });
    expect(attachB.ok).toBe(false);

    const keyA = buildAttachmentKey({
      tenantId: a.tenantId,
      ticketId,
      filename: "ok.jpg",
    });
    const attachA = await confirmAttachmentUpload({
      tenantId: a.tenantId,
      actorUserId: a.userId,
      role: Role.owner,
      membership: memA,
      data: {
        ticketId,
        storageKey: keyA,
        mime: "image/jpeg",
        sizeBytes: 120,
      },
    });
    expect(attachA.ok).toBe(true);
  });
});
