import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import { signupHqOwner } from "@/domain/tenancy/signup";
import {
  createStore,
  listStores,
  softDeleteStore,
  updateStore,
} from "./store-service";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

describe("store-service", () => {
  let tenantId = "";
  const emails: string[] = [];

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("owner crea/lista; store_staff denied; soft-delete nasconde", async () => {
    const stamp = Date.now().toString(36);
    const email = `store-own-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner",
      email,
      password: "TestPass123!",
      workspaceName: `Stores ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    await expect(
      createStore({
        tenantId,
        role: Role.store_staff,
        data: { name: "No" },
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(
      await createStore({
        tenantId,
        role: Role.owner,
        data: { name: "X" },
      }),
    ).toEqual({ ok: false, code: "storeNameRequired" });

    const created = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Centro", city: "Roma" },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(
      await updateStore({
        tenantId,
        role: Role.owner,
        storeId: "missing-store-id",
        data: { name: "PV Ghost" },
      }),
    ).toEqual({ ok: false, code: "storeNotFound" });

    const listed = await listStores(tenantId);
    expect(listed.some((s) => s.id === created.store.id)).toBe(true);

    await softDeleteStore({
      tenantId,
      role: Role.admin_hq,
      storeId: created.store.id,
    });
    const after = await listStores(tenantId);
    expect(after.find((s) => s.id === created.store.id)).toBeUndefined();
  });
});
