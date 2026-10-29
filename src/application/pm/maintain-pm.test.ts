import { PmEventStatus, Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { maintainPmJobs } from "@/application/pm/maintain-pm";
import { remindDuePmEvents } from "@/application/pm/remind-due";
import {
  createPmSeries,
  expandAllPmSeries,
} from "@/domain/pm/pm-series-service";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

describe("maintainPmJobs / remindDuePmEvents", () => {
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

  it("espande serie idempotente e ricorda visite una sola volta", async () => {
    const stamp = Date.now().toString(36);
    const email = `pm-job-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner PM Job",
      email,
      password: "TestPass123!",
      workspaceName: `PM Job ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV PM Job", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const now = new Date("2026-10-29T10:00:00.000Z");
    const series = await createPmSeries({
      tenantId,
      role: Role.owner,
      data: {
        storeId: store.store.id,
        title: "PM settimanale frigo",
        dtstart: now,
        recurrence: "weekly",
      },
    });
    expect(series.ok).toBe(true);
    if (!series.ok) return;
    expect(series.created).toBeGreaterThanOrEqual(1);

    const secondExpand = await expandAllPmSeries(now);
    expect(secondExpand.created).toBe(0);

    const dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const event = await prisma.plannedMaintenanceEvent.create({
      data: {
        tenantId,
        storeId: store.store.id,
        title: "Visita reminder test",
        scheduledAt: dueAt,
        status: PmEventStatus.planned,
      },
    });

    const firstRemind = await remindDuePmEvents(now, 48);
    expect(firstRemind.reminded).toBeGreaterThanOrEqual(1);

    const claimed = await prisma.plannedMaintenanceEvent.findFirstOrThrow({
      where: { id: event.id },
    });
    expect(claimed.remindedAt).toBeTruthy();

    const secondRemind = await remindDuePmEvents(now, 48);
    expect(secondRemind.reminded).toBe(0);

    const job = await maintainPmJobs(now);
    expect(job.series).toBeGreaterThanOrEqual(1);
    expect(job.created).toBe(0);
    expect(job.reminded).toBe(0);
  });
});
