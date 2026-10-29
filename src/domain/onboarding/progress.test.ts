import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createInvite, acceptInvite } from "@/domain/invites/invite";
import { createStore } from "@/domain/stores/store-service";
import { createVendor } from "@/domain/vendors/vendor-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import {
  getOnboardingSnapshot,
  skipOnboarding,
} from "./progress";

describe("onboarding progress", () => {
  let tenantId = "";
  const emails: string[] = [];

  afterAll(async () => {
    if (tenantId) {
      await prisma.inviteToken.deleteMany({ where: { tenantId } });
      await prisma.onboardingProgress.deleteMany({ where: { tenantId } });
      await prisma.slaPolicy.deleteMany({ where: { tenantId } });
      await prisma.vendor.deleteMany({ where: { tenantId } });
      await prisma.store.deleteMany({ where: { tenantId } });
      await prisma.membership.deleteMany({ where: { tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    }
    for (const email of emails) {
      await prisma.session.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("SLA default al signup; progress avanza; skip persistito", async () => {
    process.env.PGBOSS_DISABLED = "true";
    const stamp = Date.now().toString(36);
    const email = `onb-${stamp}@test.facilityflow.local`;
    emails.push(email);

    const signup = await signupHqOwner({
      name: "Owner Onb",
      email,
      password: "TestPass123!",
      workspaceName: `Onb ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    let snap = await getOnboardingSnapshot(tenantId);
    expect(snap.steps.find((s) => s.id === "sla")?.done).toBe(true);
    expect(snap.steps.find((s) => s.id === "stores")?.done).toBe(false);

    await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Onb" },
    });
    await createVendor({
      tenantId,
      role: Role.owner,
      data: { name: "Vendor Onb" },
    });

    const invitee = `sm-${stamp}@test.facilityflow.local`;
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
    await acceptInvite({
      rawToken: inv.acceptUrl.split("/invite/")[1]!,
      name: "SM",
      password: "SmPass123!",
    });

    snap = await getOnboardingSnapshot(tenantId);
    expect(snap.networkComplete).toBe(true);
    expect(snap.doneCount).toBe(4);

    await skipOnboarding(tenantId);
    snap = await getOnboardingSnapshot(tenantId);
    expect(snap.skippedAt).toBeTruthy();
  });
});
