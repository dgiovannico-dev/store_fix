import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { ForbiddenError } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { createTicket } from "@/application/tickets/create-ticket";
import { getHqOverview } from "./hq-overview";

describe("getHqOverview", () => {
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

  it("conteggia aperti/breached/a rischio/MTTR/costi per tenant", async () => {
    const stamp = Date.now().toString(36);
    const email = `hq-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner HQ",
      email,
      password: "TestPass123!",
      workspaceName: `HQ ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    userId = signup.userId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV HQ", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

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
        description: "Frigo caldo per dashboard test",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const now = new Date();
    // breached open
    await prisma.ticket.update({
      where: { id: created.ticket.id },
      data: { slaBreachedAt: now },
    });

    // verified with cost for MTTR/costi
    const openedAt = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    await prisma.ticket.create({
      data: {
        tenantId,
        storeId: store.store.id,
        category: "hvac",
        priority: TicketPriority.normal,
        status: TicketStatus.verified,
        description: "Verified MTTR seed",
        openedAt,
        verifiedAt: new Date(openedAt.getTime() + 4 * 60 * 60 * 1000),
        doneAt: new Date(openedAt.getTime() + 3 * 60 * 60 * 1000),
        actualCost: 250,
        slaDueAt: new Date(openedAt.getTime() + 72 * 60 * 60 * 1000),
      },
    });

    const overview = await getHqOverview({
      tenantId,
      role: Role.owner,
      rangeDays: 30,
      now,
    });

    expect(overview.openCount).toBeGreaterThanOrEqual(1);
    expect(overview.breachedCount).toBeGreaterThanOrEqual(1);
    expect(overview.mttrHours).toBeCloseTo(4, 0);
    expect(overview.costsTotal).toBe(250);
    expect(overview.byStore.some((s) => s.storeId === store.store.id)).toBe(
      true,
    );

    await expect(
      getHqOverview({ tenantId, role: Role.store_staff }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const finance = await getHqOverview({
      tenantId,
      role: Role.viewer_finance,
      now,
    });
    expect(finance.costsTotal).toBe(250);
  });
});
