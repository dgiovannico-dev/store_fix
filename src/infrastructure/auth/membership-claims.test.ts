import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { acceptInvite, createInvite } from "@/domain/invites/invite";
import { softDisableMembership } from "@/application/memberships/membership-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { resolveActiveMembershipClaims } from "./membership-claims";

describe("resolveActiveMembershipClaims", () => {
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

  it("returns claims for active membership and clears after soft-disable", async () => {
    process.env.PGBOSS_DISABLED = "true";
    const stamp = Date.now().toString(36);
    const ownerEmail = `claims-own-${stamp}@test.facilityflow.local`;
    const mgrEmail = `claims-mgr-${stamp}@test.facilityflow.local`;
    emails.push(ownerEmail, mgrEmail);

    const signup = await signupHqOwner({
      name: "Claims Owner",
      email: ownerEmail,
      password: "TestPass123!",
      workspaceName: `Claims ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    const inv = await createInvite({
      tenantId,
      actorRole: Role.owner,
      actorUserId: signup.userId,
      email: mgrEmail,
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

    const mgr = await prisma.user.findUniqueOrThrow({
      where: { email: mgrEmail },
    });
    const membership = await prisma.membership.findFirstOrThrow({
      where: { tenantId, userId: mgr.id },
    });

    const active = await resolveActiveMembershipClaims(
      mgr.id,
      membership.id,
    );
    expect(active).toEqual({
      tenantId,
      role: Role.store_manager,
      membershipId: membership.id,
    });

    const disabled = await softDisableMembership({
      tenantId,
      actorRole: Role.owner,
      membershipId: membership.id,
    });
    expect(disabled.ok).toBe(true);

    const cleared = await resolveActiveMembershipClaims(mgr.id, membership.id);
    expect(cleared.tenantId).toBeUndefined();
    expect(cleared.role).toBeUndefined();
    expect(cleared.membershipId).toBeUndefined();
  });
});
