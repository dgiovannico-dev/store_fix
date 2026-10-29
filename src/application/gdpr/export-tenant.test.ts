import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { ForbiddenError } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { exportTenantGdpr } from "./export-tenant";

describe("exportTenantGdpr", () => {
  let tenantA = "";
  let tenantB = "";
  const emails: string[] = [];

  afterAll(async () => {
    if (tenantA) await cleanupTenant(tenantA);
    if (tenantB) await cleanupTenant(tenantB);
    for (const email of emails) {
      await prisma.session.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("owner esporta solo il proprio tenant; finance deny", async () => {
    const stamp = Date.now().toString(36);
    const aEmail = `gdpr-a-${stamp}@test.facilityflow.local`;
    const bEmail = `gdpr-b-${stamp}@test.facilityflow.local`;
    emails.push(aEmail, bEmail);

    const a = await signupHqOwner({
      name: "Owner A",
      email: aEmail,
      password: "TestPass123!",
      workspaceName: `GDPR-A-${stamp}-${Math.random().toString(36).slice(2, 8)}`,
    });
    expect(a.ok).toBe(true);
    if (!a.ok) return;

    const b = await signupHqOwner({
      name: "Owner B",
      email: bEmail,
      password: "TestPass123!",
      workspaceName: `GDPR-B-${stamp}-${Math.random().toString(36).slice(2, 8)}`,
    });
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    tenantA = a.tenantId;
    tenantB = b.tenantId;

    const exportA = await exportTenantGdpr({
      tenantId: tenantA,
      role: Role.owner,
    });
    expect(exportA.region).toBe("EU");
    const data = exportA.data as { tenant: { id: string } };
    expect(data.tenant.id).toBe(tenantA);

    await expect(
      exportTenantGdpr({ tenantId: tenantA, role: Role.viewer_finance }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const exportB = await exportTenantGdpr({
      tenantId: tenantB,
      role: Role.admin_hq,
    });
    expect((exportB.data as { tenant: { id: string } }).tenant.id).toBe(
      tenantB,
    );
  });
});
