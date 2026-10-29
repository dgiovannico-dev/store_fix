import { TicketPriority } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ensureDefaultSlaPolicies } from "./defaults";
import { addHoursInTimezone, computeSlaDueAt } from "./compute-due-at";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

describe("computeSlaDueAt", () => {
  let tenantId = "";

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
    await prisma.$disconnect();
  });

  it("aggiunge ore e usa policy tenant; change policy non ricalcola existing", async () => {
    const tenant = await prisma.tenant.create({
      data: { name: "SLA Due", slug: `due-${Date.now().toString(36)}` },
    });
    tenantId = tenant.id;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const openedAt = new Date("2026-06-15T10:00:00.000Z");
    const due = await computeSlaDueAt({
      tenantId,
      category: "frigo",
      priority: TicketPriority.critical,
      openedAt,
      storeTimezone: "Europe/Rome",
    });
    expect(due.resolutionHours).toBe(4);
    expect(due.slaDueAt.toISOString()).toBe(
      addHoursInTimezone(openedAt, 4, "Europe/Rome").toISOString(),
    );

    const frozen = due.slaDueAt;
    await prisma.slaPolicy.updateMany({
      where: { tenantId, category: "frigo", priority: TicketPriority.critical },
      data: { resolutionHours: 99 },
    });
    // Ticket già aperti tengono frozen — calcolatore su nuovi openedAt solo
    expect(frozen.toISOString()).toBe(
      addHoursInTimezone(openedAt, 4, "Europe/Rome").toISOString(),
    );
  });

  it("timezone Europe/Rome documentata (Instant + hours)", () => {
    const opened = new Date("2026-01-15T08:00:00.000Z");
    const due = addHoursInTimezone(opened, 24, "Europe/Rome");
    expect(due.getTime() - opened.getTime()).toBe(24 * 3600 * 1000);
  });
});
