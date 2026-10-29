import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/domain/rbac/guards";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  createPmEvent,
  listPmEvents,
  markPmEventDone,
} from "./pm-event-service";
import { createPmSeries } from "./pm-series-service";

describe("pm-event-service", () => {
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

  it("crea lista e completa visita; deny store_staff", async () => {
    const stamp = Date.now().toString(36);
    const email = `pm-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner PM",
      email,
      password: "TestPass123!",
      workspaceName: `PM ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV PM", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const created = await createPmEvent({
      tenantId,
      role: Role.owner,
      data: {
        storeId: store.store.id,
        title: "Controllo frigo trimestrale",
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const list = await listPmEvents({ tenantId, role: Role.ops_coordinator });
    expect(list.some((e) => e.id === created.event.id)).toBe(true);

    const done = await markPmEventDone({
      tenantId,
      role: Role.owner,
      eventId: created.event.id,
    });
    expect(done.ok).toBe(true);

    await expect(
      listPmEvents({ tenantId, role: Role.store_staff }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const series = await createPmSeries({
      tenantId,
      role: Role.owner,
      data: {
        storeId: store.store.id,
        title: "PM mensile frigo",
        dtstart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        recurrence: "monthly",
      },
    });
    expect(series.ok).toBe(true);
    if (!series.ok) return;
    expect(series.created).toBeGreaterThanOrEqual(1);

    const listAfter = await listPmEvents({
      tenantId,
      role: Role.owner,
      horizonDays: 100,
    });
    expect(listAfter.some((e) => e.seriesId === series.series.id)).toBe(true);
  });
});
