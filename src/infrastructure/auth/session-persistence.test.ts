import { randomUUID } from "crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";

/**
 * Verifica AC T1.11: sessioni Auth persistite in Postgres e revocabili.
 * Self-contained (no seed pilota) — CI migrate-only.
 */
describe("session persistence (Postgres)", () => {
  const cleanupUserIds: string[] = [];
  const createdSessionIds: string[] = [];

  afterAll(async () => {
    if (createdSessionIds.length) {
      await prisma.session.deleteMany({
        where: { id: { in: createdSessionIds } },
      });
    }
    if (cleanupUserIds.length) {
      await prisma.session.deleteMany({
        where: { userId: { in: cleanupUserIds } },
      });
      await prisma.user.deleteMany({ where: { id: { in: cleanupUserIds } } });
    }
    await prisma.$disconnect();
  });

  it("crea e revoca una Session collegata a uno user", async () => {
    const stamp = Date.now().toString(36);
    const user = await prisma.user.create({
      data: {
        email: `session-${stamp}@test.facilityflow.local`,
        name: "Session Test",
        passwordHash: "x",
      },
    });
    cleanupUserIds.push(user.id);

    const sessionToken = randomUUID();
    const row = await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 60_000),
      },
    });
    createdSessionIds.push(row.id);

    const found = await prisma.session.findUnique({
      where: { sessionToken },
    });
    expect(found?.userId).toBe(user.id);

    await prisma.session.delete({ where: { sessionToken } });
    const gone = await prisma.session.findUnique({
      where: { sessionToken },
    });
    expect(gone).toBeNull();
    createdSessionIds.length = 0;
  });
});
