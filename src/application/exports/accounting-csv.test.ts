import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/domain/rbac/guards";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { buildAccountingCsv } from "./accounting-csv";

describe("buildAccountingCsv", () => {
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

  it("esporta verified con costo; deny store_staff; finance ok", async () => {
    const stamp = Date.now().toString(36);
    const email = `acc-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner Acc",
      email,
      password: "TestPass123!",
      workspaceName: `Acc ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: 'PV "Acc", Roma', timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const openedAt = new Date(Date.now() - 48 * 3600_000);
    await prisma.ticket.create({
      data: {
        tenantId,
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.normal,
        status: TicketStatus.verified,
        description: "Costo contabile test",
        openedAt,
        verifiedAt: new Date(openedAt.getTime() + 24 * 3600_000),
        doneAt: new Date(openedAt.getTime() + 20 * 3600_000),
        actualCost: 199.5,
        slaDueAt: new Date(openedAt.getTime() + 72 * 3600_000),
      },
    });

    const csv = await buildAccountingCsv({
      tenantId,
      role: Role.viewer_finance,
      withBom: true,
    });
    expect(csv.rowCount).toBe(1);
    expect(csv.body.startsWith("\uFEFF")).toBe(true);
    expect(csv.body).toContain("199.50");
    expect(csv.body).toContain("EUR");
    expect(csv.body).toContain('"PV ""Acc"", Roma"');

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { currency: "USD" },
    });
    const usd = await buildAccountingCsv({
      tenantId,
      role: Role.viewer_finance,
    });
    expect(usd.body).toContain("USD");
    expect(usd.body).not.toMatch(/,EUR\r?\n/);

    await expect(
      buildAccountingCsv({ tenantId, role: Role.store_staff }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
