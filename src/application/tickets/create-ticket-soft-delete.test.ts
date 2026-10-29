import { Role, TicketPriority } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import {
  createStore,
  restoreStore,
  softDeleteStore,
} from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { ForbiddenError } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { createTicket } from "./create-ticket";

describe("soft-delete store ↔ createTicket", () => {
  let tenantId = "";
  let otherTenantId = "";
  let userId = "";
  const emails: string[] = [];

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
    if (otherTenantId) await cleanupTenant(otherTenantId);
    for (const email of emails) {
      await prisma.session.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("store soft-deleted blocca create; restore solo stesso tenant", async () => {
    const stamp = Date.now().toString(36);
    const email = `sd-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner SD",
      email,
      password: "TestPass123!",
      workspaceName: `SD ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    userId = signup.userId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const otherEmail = `sd2-${stamp}@test.facilityflow.local`;
    emails.push(otherEmail);
    const other = await signupHqOwner({
      name: "Owner Other",
      email: otherEmail,
      password: "TestPass123!",
      workspaceName: `SD2 ${stamp}`,
    });
    expect(other.ok).toBe(true);
    if (!other.ok) return;
    otherTenantId = other.tenantId;

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Soft", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    await softDeleteStore({
      tenantId,
      role: Role.owner,
      storeId: store.store.id,
    });

    const membership = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
    };

    const blocked = await createTicket({
      tenantId,
      actorUserId: userId,
      role: Role.owner,
      membership,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.critical,
        description: "Non deve passare su store archiviato",
      },
    });
    expect(blocked.ok).toBe(false);

    await expect(
      restoreStore({
        tenantId: otherTenantId,
        role: Role.owner,
        storeId: store.store.id,
      }),
    ).resolves.toMatchObject({ ok: false });

    const restored = await restoreStore({
      tenantId,
      role: Role.owner,
      storeId: store.store.id,
    });
    expect(restored.ok).toBe(true);

    await expect(
      restoreStore({
        tenantId,
        role: Role.ops_coordinator,
        storeId: store.store.id,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const ok = await createTicket({
      tenantId,
      actorUserId: userId,
      role: Role.owner,
      membership,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.critical,
        description: "Dopo restore lo store è di nuovo valido",
      },
    });
    expect(ok.ok).toBe(true);
  });
});
