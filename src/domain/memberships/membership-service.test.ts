import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createInvite, acceptInvite } from "@/domain/invites/invite";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  getActiveMembership,
  softDisableMembership,
  updateMembership,
} from "./membership-service";

describe("membership-service", () => {
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

  it("aggiorna storeIds; soft-disable blocca active membership; vendorId required", async () => {
    process.env.PGBOSS_DISABLED = "true";
    const stamp = Date.now().toString(36);
    const ownerEmail = `mown-${stamp}@test.facilityflow.local`;
    emails.push(ownerEmail);
    const signup = await signupHqOwner({
      name: "Owner",
      email: ownerEmail,
      password: "TestPass123!",
      workspaceName: `Mem ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Scope" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const invitee = `mgr-${stamp}@test.facilityflow.local`;
    emails.push(invitee);
    const inv = await createInvite({
      tenantId,
      actorRole: Role.owner,
      actorUserId: signup.userId,
      email: invitee,
      role: Role.store_manager,
    });
    expect(inv.ok).toBe(true);
    if (!inv.ok) return;
    const raw = inv.acceptUrl.split("/invite/")[1]!;
    await acceptInvite({
      rawToken: raw,
      name: "Manager",
      password: "MgrPass123!",
    });

    const membership = await prisma.membership.findFirst({
      where: { tenantId, user: { email: invitee } },
    });
    expect(membership).toBeTruthy();
    if (!membership) return;

    const updated = await updateMembership({
      tenantId,
      actorRole: Role.admin_hq,
      membershipId: membership.id,
      data: { storeIds: [store.store.id] },
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.membership.storeIds).toEqual([store.store.id]);

    const vendorFail = await updateMembership({
      tenantId,
      actorRole: Role.owner,
      membershipId: membership.id,
      data: { role: Role.vendor, vendorId: null },
    });
    expect(vendorFail).toEqual({
      ok: false,
      code: "vendorIdRequiredForVendor",
    });

    const ownerMem = await prisma.membership.findFirst({
      where: { tenantId, role: Role.owner },
    });
    expect(ownerMem).toBeTruthy();
    if (ownerMem) {
      const blockOwner = await softDisableMembership({
        tenantId,
        actorRole: Role.owner,
        membershipId: ownerMem.id,
      });
      expect(blockOwner.ok).toBe(false);
      if (!blockOwner.ok) expect(blockOwner.code).toBe("cannotDisableOwner");
    }

    await softDisableMembership({
      tenantId,
      actorRole: Role.owner,
      membershipId: membership.id,
    });
    const active = await getActiveMembership(
      (
        await prisma.user.findUniqueOrThrow({ where: { email: invitee } })
      ).id,
      tenantId,
    );
    expect(active).toBeNull();
  });
});
