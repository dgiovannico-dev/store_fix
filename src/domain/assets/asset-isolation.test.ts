import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/domain/rbac/guards";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { createAsset, listAssets, softDeleteAsset } from "./asset-service";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

describe("asset isolation", () => {
  const tenantIds: string[] = [];
  const emails: string[] = [];

  afterAll(async () => {
    for (const tenantId of tenantIds) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("cross-tenant e cross-store membership", async () => {
    const stamp = Date.now().toString(36);
    const emailA = `aa-${stamp}@test.facilityflow.local`;
    const emailB = `ab-${stamp}@test.facilityflow.local`;
    emails.push(emailA, emailB);

    const a = await signupHqOwner({
      name: "Owner A",
      email: emailA,
      password: "TestPass123!",
      workspaceName: `AA ${stamp}`,
    });
    const b = await signupHqOwner({
      name: "Owner B",
      email: emailB,
      password: "TestPass123!",
      workspaceName: `AB ${stamp}`,
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    tenantIds.push(a.tenantId, b.tenantId);

    const s1 = await createStore({
      tenantId: a.tenantId,
      role: Role.owner,
      data: { name: "Store 1" },
    });
    const s2 = await createStore({
      tenantId: a.tenantId,
      role: Role.owner,
      data: { name: "Store 2" },
    });
    expect(s1.ok && s2.ok).toBe(true);
    if (!s1.ok || !s2.ok) return;

    const hqMembership = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
    };

    const asset = await createAsset({
      tenantId: a.tenantId,
      role: Role.owner,
      membership: hqMembership,
      data: {
        storeId: s1.store.id,
        category: "frigo",
        label: "Banco frigo 1",
      },
    });
    expect(asset.ok).toBe(true);
    if (!asset.ok) return;

    const staffStore1 = {
      role: Role.store_staff,
      storeIds: [s1.store.id],
      deletedAt: null,
    };
    const staffStore2 = {
      role: Role.store_staff,
      storeIds: [s2.store.id],
      deletedAt: null,
    };

    const forStaff1 = await listAssets({
      tenantId: a.tenantId,
      membership: staffStore1,
    });
    expect(forStaff1.some((x) => x.id === asset.asset.id)).toBe(true);

    const forStaff2 = await listAssets({
      tenantId: a.tenantId,
      membership: staffStore2,
    });
    expect(forStaff2.find((x) => x.id === asset.asset.id)).toBeUndefined();

    await expect(
      softDeleteAsset({
        tenantId: a.tenantId,
        role: Role.store_staff,
        membership: staffStore2,
        assetId: asset.asset.id,
      }),
    ).rejects.toThrow(ForbiddenError);

    const bHq = { role: Role.owner, storeIds: [] as string[], deletedAt: null };
    const cross = await listAssets({
      tenantId: b.tenantId,
      membership: bHq,
    });
    expect(cross.find((x) => x.id === asset.asset.id)).toBeUndefined();
  });
});
