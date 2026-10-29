import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createVendor } from "@/domain/vendors/vendor-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { acceptInvite, createInvite } from "./invite";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

describe("vendor invite", () => {
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

  it("rifiuta vendor senza vendorId; accept collega Membership", async () => {
    process.env.PGBOSS_DISABLED = "true";
    const stamp = Date.now().toString(36);
    const ownerEmail = `vo-${stamp}@test.facilityflow.local`;
    emails.push(ownerEmail);
    const signup = await signupHqOwner({
      name: "Owner",
      email: ownerEmail,
      password: "TestPass123!",
      workspaceName: `VI ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    const missing = await createInvite({
      tenantId,
      actorRole: Role.owner,
      actorUserId: signup.userId,
      email: `v-${stamp}@test.facilityflow.local`,
      role: Role.vendor,
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.code).toBe("vendorIdRequiredForVendor");

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: { name: "TechFix", trades: ["hvac"] },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const invitee = `vendor-user-${stamp}@test.facilityflow.local`;
    emails.push(invitee);
    const invited = await createInvite({
      tenantId,
      actorRole: Role.admin_hq,
      actorUserId: signup.userId,
      email: invitee,
      role: Role.vendor,
      vendorId: vendor.vendor.id,
    });
    expect(invited.ok).toBe(true);
    if (!invited.ok) return;

    const raw = invited.acceptUrl.split("/invite/")[1]!;
    const accepted = await acceptInvite({
      rawToken: raw,
      name: "Vendor User",
      password: "VendorPass1!",
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;

    const m = await prisma.membership.findFirst({
      where: { tenantId, user: { email: invitee } },
    });
    expect(m?.role).toBe(Role.vendor);
    expect(m?.vendorId).toBe(vendor.vendor.id);
  });
});
