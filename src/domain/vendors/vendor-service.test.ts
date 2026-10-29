import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/domain/rbac/guards";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  createVendor,
  listVendors,
  softDeleteVendor,
} from "./vendor-service";

describe("vendor-service", () => {
  let tenantId = "";
  const emails: string[] = [];

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("CRUD + coverage; store_staff denied", async () => {
    const stamp = Date.now().toString(36);
    const email = `ven-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner",
      email,
      password: "TestPass123!",
      workspaceName: `Ven ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Coverage" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    await expect(
      createVendor({
        tenantId,
        role: Role.store_staff,
        data: { name: "No" },
      }),
    ).rejects.toThrow(ForbiddenError);

    const created = await createVendor({
      tenantId,
      role: Role.ops_coordinator,
      data: {
        name: "Frigo SpA",
        email: "ops@frigo.test",
        trades: ["frigo"],
        storeCoverageIds: [store.store.id],
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.vendor.storeCoverageIds).toContain(store.store.id);

    const listed = await listVendors(tenantId);
    expect(listed.some((v) => v.id === created.vendor.id)).toBe(true);

    await softDeleteVendor({
      tenantId,
      role: Role.admin_hq,
      vendorId: created.vendor.id,
    });
    expect(
      (await listVendors(tenantId)).find((v) => v.id === created.vendor.id),
    ).toBeUndefined();
  });
});
