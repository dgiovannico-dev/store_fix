import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createStore, listStores, updateStore } from "@/domain/stores/store-service";
import {
  createVendor,
  getVendor,
  listVendors,
  softDeleteVendor,
  updateVendor,
} from "@/domain/vendors/vendor-service";
import { prisma } from "@/infrastructure/db/prisma";
import { signupHqOwner } from "./signup";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

/** T1.25 — A non legge/aggiorna store/vendor di B. */
describe("store/vendor cross-tenant isolation", () => {
  const tenantIds: string[] = [];
  const emails: string[] = [];

  afterAll(async () => {
    for (const tenantId of tenantIds) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("isolamento read/update/delete", async () => {
    const stamp = Date.now().toString(36);
    const emailA = `iso-a-${stamp}@test.facilityflow.local`;
    const emailB = `iso-b-${stamp}@test.facilityflow.local`;
    emails.push(emailA, emailB);

    const a = await signupHqOwner({
      name: "Owner A",
      email: emailA,
      password: "TestPass123!",
      workspaceName: `IsoA ${stamp}`,
    });
    const b = await signupHqOwner({
      name: "Owner B",
      email: emailB,
      password: "TestPass123!",
      workspaceName: `IsoB ${stamp}`,
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    tenantIds.push(a.tenantId, b.tenantId);

    const storeA = await createStore({
      tenantId: a.tenantId,
      role: Role.owner,
      data: { name: "Solo A" },
    });
    expect(storeA.ok).toBe(true);
    if (!storeA.ok) return;

    const vendorA = await createVendor({
      tenantId: a.tenantId,
      role: Role.owner,
      data: {
        name: "Vendor A",
        storeCoverageIds: [storeA.store.id],
      },
    });
    expect(vendorA.ok).toBe(true);
    if (!vendorA.ok) return;

    expect(
      (await listStores(b.tenantId)).find((s) => s.id === storeA.store.id),
    ).toBeUndefined();
    expect(await getVendor(b.tenantId, vendorA.vendor.id)).toBeNull();
    expect(
      (await listVendors(b.tenantId)).find((v) => v.id === vendorA.vendor.id),
    ).toBeUndefined();

    const updStore = await updateStore({
      tenantId: b.tenantId,
      role: Role.owner,
      storeId: storeA.store.id,
      data: { name: "Hacked" },
    });
    expect(updStore.ok).toBe(false);

    const updVendor = await updateVendor({
      tenantId: b.tenantId,
      role: Role.owner,
      vendorId: vendorA.vendor.id,
      data: { name: "Hacked" },
    });
    expect(updVendor.ok).toBe(false);

    const del = await softDeleteVendor({
      tenantId: b.tenantId,
      role: Role.owner,
      vendorId: vendorA.vendor.id,
    });
    expect(del.ok).toBe(false);

    const still = await getVendor(a.tenantId, vendorA.vendor.id);
    expect(still?.name).toBe("Vendor A");
  });
});
