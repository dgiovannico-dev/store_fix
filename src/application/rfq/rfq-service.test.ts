import { QuoteStatus, Role, TicketPriority } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createStore } from "@/domain/stores/store-service";
import { createTicket } from "@/application/tickets/create-ticket";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  awardQuoteBid,
  createQuoteRequest,
  submitQuoteBid,
} from "./rfq-service";

describe("rfq-service F3-07", () => {
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

  it("crea RFQ, bid vendor, award → ticket", async () => {
    const stamp = Date.now().toString(36);
    const email = `rfq-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner RFQ",
      email,
      password: "TestPass123!",
      workspaceName: `RFQ ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV RFQ", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const v1 = await prisma.vendor.create({
      data: { tenantId, name: "Vendor A" },
    });
    const v2 = await prisma.vendor.create({
      data: { tenantId, name: "Vendor B" },
    });

    const ticket = await createTicket({
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
        description: "Guasto per RFQ",
      },
    });
    expect(ticket.ok).toBe(true);
    if (!ticket.ok) return;

    const rfq = await createQuoteRequest({
      tenantId,
      role: Role.ops_coordinator,
      actorUserId: signup.userId,
      data: {
        title: "Preventivi frigo",
        ticketId: ticket.ticket.id,
        vendorIds: [v1.id, v2.id],
      },
    });
    expect(rfq.ok).toBe(true);
    if (!rfq.ok) return;
    expect(rfq.request.bids).toHaveLength(2);

    const bidA = rfq.request.bids.find((b) => b.vendorId === v1.id)!;
    const submitted = await submitQuoteBid({
      tenantId,
      role: Role.vendor,
      membership: { vendorId: v1.id, deletedAt: null },
      bidId: bidA.id,
      data: { amountEur: 150.5, note: "chiavi in mano" },
    });
    expect(submitted.ok).toBe(true);

    const cross = await submitQuoteBid({
      tenantId,
      role: Role.vendor,
      membership: { vendorId: v2.id, deletedAt: null },
      bidId: bidA.id,
      data: { amountEur: 99 },
    });
    expect(cross).toEqual({ ok: false, code: "rfqInviteNotFound" });

    const badCreate = await createQuoteRequest({
      tenantId,
      role: Role.owner,
      actorUserId: signup.userId,
      data: { title: "X", vendorIds: [] },
    });
    expect(badCreate).toEqual({ ok: false, code: "invalidRfqData" });

    const awarded = await awardQuoteBid({
      tenantId,
      role: Role.owner,
      actorUserId: signup.userId,
      requestId: rfq.request.id,
      bidId: bidA.id,
    });
    expect(awarded.ok).toBe(true);

    const fresh = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticket.ticket.id },
    });
    expect(fresh.vendorId).toBe(v1.id);
    expect(Number(fresh.estimatedCost)).toBe(150.5);
    expect(fresh.quoteStatus).toBe(QuoteStatus.accepted);
  });
});
