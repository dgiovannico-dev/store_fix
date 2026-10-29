import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";
import { tenantActiveWhere } from "@/infrastructure/db/tenant-scope";
import { signupHqOwner } from "./signup";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

/**
 * T1.16 — foundation: due tenant non si vedono sulle query scoped.
 */
describe("tenant isolation foundation", () => {
  const tenantIds: string[] = [];
  const emails: string[] = [];

  afterAll(async () => {
    for (const tenantId of tenantIds) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.session.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("store di A non compare nelle query di B", async () => {
    const stamp = Date.now().toString(36);
    const emailA = `a-${stamp}@test.facilityflow.local`;
    const emailB = `b-${stamp}@test.facilityflow.local`;
    emails.push(emailA, emailB);

    const a = await signupHqOwner({
      name: "Owner A",
      email: emailA,
      password: "TestPass123!",
      workspaceName: `Tenant A ${stamp}`,
    });
    const b = await signupHqOwner({
      name: "Owner B",
      email: emailB,
      password: "TestPass123!",
      workspaceName: `Tenant B ${stamp}`,
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    tenantIds.push(a.tenantId, b.tenantId);

    await prisma.store.create({
      data: {
        tenantId: a.tenantId,
        name: "PV Solo A",
        city: "Milano",
      },
    });

    const forB = await prisma.store.findMany({
      where: tenantActiveWhere(b.tenantId),
    });
    expect(forB.find((s) => s.name === "PV Solo A")).toBeUndefined();

    const forA = await prisma.store.findMany({
      where: tenantActiveWhere(a.tenantId),
    });
    expect(forA.some((s) => s.name === "PV Solo A")).toBe(true);
  });
});
