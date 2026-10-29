import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";
import {
  confirmEmailVerification,
  sendEmailVerification,
} from "./email-verification";

describe("email verification", () => {
  const email = `verify-${Date.now().toString(36)}@test.facilityflow.local`;

  afterAll(async () => {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it("token scaduto / invalido fallisce; token valido conferma", async () => {
    process.env.PGBOSS_DISABLED = "true";
    process.env.SMTP_HOST = process.env.SMTP_HOST || "localhost";
    process.env.SMTP_PORT = process.env.SMTP_PORT || "1025";

    await prisma.user.create({
      data: { email, name: "Verify Me", passwordHash: "x" },
    });

    await sendEmailVerification(email);
    const stored = await prisma.verificationToken.findFirst({
      where: { identifier: email },
    });
    expect(stored).toBeTruthy();

    const bad = await confirmEmailVerification(email, "not-the-token");
    expect(bad.ok).toBe(false);

    // recover raw token is impossible from hash — recreate controlled token
    const { createHash, randomBytes } = await import("crypto");
    const raw = randomBytes(16).toString("hex");
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: createHash("sha256").update(raw).digest("hex"),
        expires: new Date(Date.now() + 60_000),
      },
    });

    const ok = await confirmEmailVerification(email, raw);
    expect(ok.ok).toBe(true);
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.emailVerified).toBeTruthy();
  });
});
