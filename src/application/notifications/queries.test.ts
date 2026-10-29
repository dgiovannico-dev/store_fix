import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { NotificationType } from "@/domain/notification/types";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markNotificationRead,
} from "./queries";

describe("notification queries isolation", () => {
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

  it("user A non legge notifiche di user B", async () => {
    const stamp = Date.now().toString(36);
    const emailA = `na-${stamp}@test.facilityflow.local`;
    const emailB = `nb-${stamp}@test.facilityflow.local`;
    emails.push(emailA, emailB);
    const a = await signupHqOwner({
      name: "Owner NA",
      email: emailA,
      password: "TestPass123!",
      workspaceName: `Notify A ${stamp}-${Math.random().toString(36).slice(2, 6)}`,
    });
    const b = await signupHqOwner({
      name: "Owner NB",
      email: emailB,
      password: "TestPass123!",
      workspaceName: `Notify B ${stamp}-${Math.random().toString(36).slice(2, 6)}`,
    });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    tenantIds.push(a.tenantId, b.tenantId);

    const n = await prisma.notification.create({
      data: {
        tenantId: a.tenantId,
        userId: a.userId,
        type: NotificationType.ticketCreated,
        payload: { x: 1 },
      },
    });

    const listB = await listNotificationsForUser({
      tenantId: a.tenantId,
      userId: b.userId,
    });
    expect(listB.find((x) => x.id === n.id)).toBeUndefined();

    const markB = await markNotificationRead({
      tenantId: a.tenantId,
      userId: b.userId,
      notificationId: n.id,
    });
    expect(markB.ok).toBe(false);

    expect(await countUnreadNotifications(a.tenantId, a.userId)).toBeGreaterThan(
      0,
    );
    void Role.owner;
  });
});
