import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { signupHqOwner } from "./signup";

describe("signupHqOwner", () => {
  const cleanup: { email: string; tenantId: string }[] = [];

  afterAll(async () => {
    for (const row of cleanup) {
      await prisma.session.deleteMany({
        where: { user: { email: row.email } },
      });
      await cleanupTenant(row.tenantId);
      await prisma.user.deleteMany({ where: { email: row.email } });
    }
    await prisma.$disconnect();
  });

  it("crea Tenant + Membership owner + SLA default", async () => {
    const stamp = Date.now().toString(36);
    const email = `owner-${stamp}@test.facilityflow.local`;

    const result = await signupHqOwner({
      name: "Owner Test",
      email,
      password: "TestPass123!",
      workspaceName: `Workspace ${stamp}`,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    cleanup.push({ email, tenantId: result.tenantId });

    const user = await prisma.user.findUnique({ where: { id: result.userId } });
    expect(user?.passwordHash).toBeTruthy();
    expect(user?.passwordHash).not.toContain("TestPass123!");

    const membership = await prisma.membership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: result.tenantId,
          userId: result.userId,
        },
      },
    });
    expect(membership?.role).toBe("owner");

    const sla = await prisma.slaPolicy.count({
      where: { tenantId: result.tenantId, deletedAt: null },
    });
    expect(sla).toBeGreaterThanOrEqual(3);

    const onb = await prisma.onboardingProgress.findUnique({
      where: { tenantId: result.tenantId },
    });
    expect(onb).toBeTruthy();
  });

  it("rifiuta email già registrata senza leak esplicito", async () => {
    const result = await signupHqOwner({
      name: "Altro Owner",
      email: "owner@demo.facilityflow.local",
      password: "DemoOwner123!",
      workspaceName: "Altro Workspace",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("EMAIL_TAKEN");
  });
});
