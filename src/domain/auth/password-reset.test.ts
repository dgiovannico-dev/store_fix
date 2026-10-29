import { createHash, randomBytes } from "crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { resetPassword } from "./password-reset";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

describe("password reset", () => {
  const emails: string[] = [];
  let tenantId = "";
  let userId = "";

  afterAll(async () => {
    if (userId) {
      await prisma.session.deleteMany({ where: { userId } });
    }
    if (tenantId) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: { contains: email } },
      });
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("reset aggiorna password e invalida sessioni", async () => {
    const stamp = Date.now().toString(36);
    const email = `reset-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Reset Me",
      email,
      password: "OldPass123!",
      workspaceName: `Reset ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    userId = signup.userId;

    await prisma.session.create({
      data: {
        sessionToken: randomBytes(16).toString("hex"),
        userId,
        expires: new Date(Date.now() + 86_400_000),
      },
    });

    const raw = randomBytes(16).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: `pwdreset:${email}`,
        token: createHash("sha256").update(raw).digest("hex"),
        expires: new Date(Date.now() + 60_000),
      },
    });

    const result = await resetPassword({
      email,
      rawToken: raw,
      newPassword: "NewPass123!",
    });
    expect(result.ok).toBe(true);

    const sessions = await prisma.session.count({ where: { userId } });
    expect(sessions).toBe(0);
  });
});
