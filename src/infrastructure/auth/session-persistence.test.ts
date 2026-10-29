import { randomUUID } from "crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";

/**
 * Verifica AC T1.11: sessioni Auth persistite in Postgres e revocabili.
 * Richiede DATABASE_URL (Compose postgres).
 */
describe("session persistence (Postgres)", () => {
  const createdSessionIds: string[] = [];

  afterAll(async () => {
    if (createdSessionIds.length) {
      await prisma.session.deleteMany({
        where: { id: { in: createdSessionIds } },
      });
    }
    await prisma.$disconnect();
  });

  it("crea e revoca una Session collegata allo user seed", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "owner@demo.facilityflow.local" },
    });
    expect(user).toBeTruthy();
    if (!user) return;

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
