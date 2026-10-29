import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createInvite, acceptInvite } from "@/domain/invites/invite";
import { ForbiddenError } from "@/domain/rbac/guards";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  listMembershipConfigAudit,
  softDisableMembership,
  updateMembership,
} from "./membership-service";

describe("config audit membership (F2-09)", () => {
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

  it("append-only su update/disable; list solo owner/admin; no leak cross-tenant", async () => {
    process.env.PGBOSS_DISABLED = "true";
    const stamp = Date.now().toString(36);
    const aEmail = `aud-a-${stamp}@test.facilityflow.local`;
    const bEmail = `aud-b-${stamp}@test.facilityflow.local`;
    emails.push(aEmail, bEmail);

    const a = await signupHqOwner({
      name: "Owner A",
      email: aEmail,
      password: "TestPass123!",
      workspaceName: `AudA-${stamp}`,
    });
    const b = await signupHqOwner({
      name: "Owner B",
      email: bEmail,
      password: "TestPass123!",
      workspaceName: `AudB-${stamp}`,
    });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    tenantA = a.tenantId;
    tenantB = b.tenantId;

    const store = await createStore({
      tenantId: tenantA,
      role: Role.owner,
      data: { name: "PV Aud", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const invitee = `aud-m-${stamp}@test.facilityflow.local`;
    emails.push(invitee);
    const inv = await createInvite({
      tenantId: tenantA,
      actorRole: Role.owner,
      actorUserId: a.userId,
      email: invitee,
      role: Role.store_manager,
    });
    expect(inv.ok).toBe(true);
    if (!inv.ok) return;
    await acceptInvite({
      rawToken: inv.acceptUrl.split("/invite/")[1]!,
      name: "Mgr Aud",
      password: "MgrPass123!",
    });

    const membership = await prisma.membership.findFirstOrThrow({
      where: { tenantId: tenantA, user: { email: invitee } },
    });

    const upd = await updateMembership({
      tenantId: tenantA,
      actorRole: Role.owner,
      actorUserId: a.userId,
      membershipId: membership.id,
      data: { storeIds: [store.store.id] },
    });
    expect(upd.ok).toBe(true);

    await softDisableMembership({
      tenantId: tenantA,
      actorRole: Role.owner,
      actorUserId: a.userId,
      membershipId: membership.id,
    });

    const events = await listMembershipConfigAudit({
      tenantId: tenantA,
      role: Role.owner,
    });
    expect(events.some((e) => e.type === "membership.updated")).toBe(true);
    expect(events.some((e) => e.type === "membership.soft_disabled")).toBe(
      true,
    );

    await expect(
      listMembershipConfigAudit({
        tenantId: tenantA,
        role: Role.viewer_finance,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const onlyB = await listMembershipConfigAudit({
      tenantId: tenantB,
      role: Role.admin_hq,
    });
    expect(onlyB.every((e) => e.tenantId === tenantB)).toBe(true);
    expect(onlyB.some((e) => e.membershipId === membership.id)).toBe(false);
  });
});

