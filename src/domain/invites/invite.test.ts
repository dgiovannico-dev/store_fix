import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/domain/rbac/guards";
import { prisma } from "@/infrastructure/db/prisma";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { acceptInvite, createInvite } from "./invite";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

describe("invites", () => {
  const emails: string[] = [];
  let tenantId = "";

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.session.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("owner invita; store_staff denied; accept applica ruolo", async () => {
    process.env.PGBOSS_DISABLED = "true";
    const stamp = Date.now().toString(36);
    const ownerEmail = `own-inv-${stamp}@test.facilityflow.local`;
    emails.push(ownerEmail);

    const signup = await signupHqOwner({
      name: "Owner",
      email: ownerEmail,
      password: "TestPass123!",
      workspaceName: `Inv Tenant ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    await expect(
      createInvite({
        tenantId,
        actorRole: Role.store_staff,
        actorUserId: signup.userId,
        email: `staff-${stamp}@test.facilityflow.local`,
        role: Role.store_manager,
      }),
    ).rejects.toThrow(ForbiddenError);

    const invitee = `mgr-${stamp}@test.facilityflow.local`;
    emails.push(invitee);
    const created = await createInvite({
      tenantId,
      actorRole: Role.owner,
      actorUserId: signup.userId,
      email: invitee,
      role: Role.store_manager,
      storeIds: [],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const raw = created.acceptUrl.split("/invite/")[1]!;
    const accepted = await acceptInvite({
      rawToken: raw,
      name: "Store Mgr",
      password: "MgrPass123!",
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.role).toBe(Role.store_manager);

    const membership = await prisma.membership.findFirst({
      where: { tenantId, user: { email: invitee } },
    });
    expect(membership?.role).toBe(Role.store_manager);

    const expired = await acceptInvite({
      rawToken: raw,
      name: "Again",
      password: "MgrPass123!",
    });
    expect(expired.ok).toBe(false);
  });
});
