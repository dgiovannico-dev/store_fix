import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/domain/rbac/guards";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { createVendor } from "@/domain/vendors/vendor-service";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  createVendorContract,
  listVendorContracts,
  softDeleteVendorContract,
} from "./vendor-contract-service";

describe("vendor-contract-service", () => {
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

  it("CRUD HQ + deny store_staff + filtro scadenze", async () => {
    const stamp = Date.now().toString(36);
    const email = `vc-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner VC",
      email,
      password: "TestPass123!",
      workspaceName: `VC ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV VC", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: {
        name: "Vendor VC",
        trades: ["hvac"],
        storeCoverageIds: [store.store.id],
      },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const startsOn = new Date();
    const endsOn = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const created = await createVendorContract({
      tenantId,
      role: Role.owner,
      data: {
        vendorId: vendor.vendor.id,
        storeId: store.store.id,
        title: "Manutenzione HVAC",
        reference: "C-1",
        startsOn,
        endsOn,
        annualFee: 1200,
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const list = await listVendorContracts({
      tenantId,
      role: Role.viewer_finance,
      expiringWithinDays: 60,
    });
    expect(list.some((c) => c.id === created.contract.id)).toBe(true);

    await expect(
      createVendorContract({
        tenantId,
        role: Role.store_staff,
        data: {
          vendorId: vendor.vendor.id,
          title: "X",
          startsOn,
          endsOn,
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const del = await softDeleteVendorContract({
      tenantId,
      role: Role.owner,
      contractId: created.contract.id,
    });
    expect(del.ok).toBe(true);
    const after = await listVendorContracts({
      tenantId,
      role: Role.owner,
    });
    expect(after.find((c) => c.id === created.contract.id)).toBeUndefined();
  });
});
