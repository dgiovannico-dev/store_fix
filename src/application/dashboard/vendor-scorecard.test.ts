import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createTicket } from "@/application/tickets/create-ticket";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { ForbiddenError } from "@/domain/rbac/guards";
import { createVendor } from "@/domain/vendors/vendor-service";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  getVendorScorecard,
  listVendorScorecards,
} from "./vendor-scorecard";

describe("listVendorScorecards", () => {
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

  it("aggrega per vendor e deny store_manager", async () => {
    const stamp = Date.now().toString(36);
    const email = `sc-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner SC",
      email,
      password: "TestPass123!",
      workspaceName: `SC ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    userId = signup.userId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV SC", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: {
        name: "Vendor Score",
        trades: ["frigo"],
        storeCoverageIds: [store.store.id],
      },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const created = await createTicket({
      tenantId,
      actorUserId: userId,
      role: Role.owner,
      membership: { role: Role.owner, storeIds: [], deletedAt: null },
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.normal,
        description: "Ticket scorecard test chiuso",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const now = new Date();
    const openedAt = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    await prisma.ticket.update({
      where: { id: created.ticket.id },
      data: {
        vendorId: vendor.vendor.id,
        status: TicketStatus.verified,
        openedAt,
        verifiedAt: now,
        doneAt: new Date(now.getTime() - 60 * 60 * 1000),
        actualCost: 120,
        slaDueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    const overview = await listVendorScorecards({
      tenantId,
      role: Role.owner,
      rangeDays: 30,
      now,
    });
    const row = overview.rows.find((r) => r.vendorId === vendor.vendor.id);
    expect(row).toBeDefined();
    expect(row!.closedCount).toBe(1);
    expect(row!.costsTotal).toBe(120);
    expect(row!.slaHitRate).toBe(1);
    expect(row!.avgResolutionDays).toBeCloseTo(2, 1);

    const single = await getVendorScorecard({
      tenantId,
      role: Role.viewer_finance,
      vendorId: vendor.vendor.id,
      now,
    });
    expect(single?.closedCount).toBe(1);

    await expect(
      listVendorScorecards({
        tenantId,
        role: Role.store_manager,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
