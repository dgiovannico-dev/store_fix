import {
  QuoteStatus,
  Role,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createTicket } from "@/application/tickets/create-ticket";
import { assignTicket, triageTicket } from "@/application/tickets/transition-ticket";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { createVendor } from "@/domain/vendors/vendor-service";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { completeVendorWork } from "./vendor-ticket-lifecycle";
import { decideTicketQuote, proposeTicketQuote } from "./ticket-quote";

describe("ticket quote F2-02", () => {
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

  it("propose → gate done → accept → complete ok", async () => {
    const stamp = Date.now().toString(36);
    const email = `q-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner Q",
      email,
      password: "TestPass123!",
      workspaceName: `Quote ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    userId = signup.userId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Quote", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: {
        name: "Vendor Quote",
        trades: ["frigo"],
        storeCoverageIds: [store.store.id],
      },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const hqMem = { role: Role.owner, storeIds: [] as string[], deletedAt: null };
    const created = await createTicket({
      tenantId,
      actorUserId: userId,
      role: Role.owner,
      membership: hqMem,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.normal,
        description: "Preventivo test ticket flusso",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await triageTicket({
      tenantId,
      ticketId: created.ticket.id,
      actorUserId: userId,
      role: Role.owner,
    });
    await assignTicket({
      tenantId,
      ticketId: created.ticket.id,
      actorUserId: userId,
      role: Role.owner,
      vendorId: vendor.vendor.id,
    });

    const vendorMem = {
      role: Role.vendor,
      vendorId: vendor.vendor.id,
      storeIds: [] as string[],
      deletedAt: null,
    };

    const proposed = await proposeTicketQuote({
      tenantId,
      ticketId: created.ticket.id,
      actorUserId: userId,
      role: Role.vendor,
      membership: vendorMem,
      data: { amountEur: 350, note: "Ricambio compressore" },
    });
    expect(proposed.ok).toBe(true);
    if (!proposed.ok) return;
    expect(proposed.ticket.quoteStatus).toBe(QuoteStatus.pending);
    expect(Number(proposed.ticket.estimatedCost)).toBe(350);

    await prisma.attachment.create({
      data: {
        tenantId,
        ticketId: created.ticket.id,
        storageKey: `test/${stamp}.jpg`,
        mime: "image/jpeg",
        sizeBytes: 100,
      },
    });

    const blocked = await completeVendorWork({
      tenantId,
      ticketId: created.ticket.id,
      actorUserId: userId,
      role: Role.vendor,
      membership: vendorMem,
      data: {
        actualCost: 360,
        completionReport: "Lavoro fatto con preventivo pending",
      },
    });
    expect(blocked.ok).toBe(false);

    const accepted = await decideTicketQuote({
      tenantId,
      ticketId: created.ticket.id,
      actorUserId: userId,
      role: Role.owner,
      membership: hqMem,
      data: { decision: "accept" },
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.ticket.quoteStatus).toBe(QuoteStatus.accepted);

    await prisma.ticket.update({
      where: { id: created.ticket.id },
      data: { status: TicketStatus.in_progress },
    });

    const done = await completeVendorWork({
      tenantId,
      ticketId: created.ticket.id,
      actorUserId: userId,
      role: Role.vendor,
      membership: vendorMem,
      data: {
        actualCost: 360,
        completionReport: "Lavoro completato dopo accettazione",
      },
    });
    expect(done.ok).toBe(true);
  });
});
