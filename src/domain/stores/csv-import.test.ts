import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";
import { _resetRateLimitForTests } from "@/infrastructure/rate-limit";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { importStoresFromCsv, STORE_CSV_MAX_ROWS } from "./csv-import";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

describe("importStoresFromCsv", () => {
  let tenantId = "";
  const emails: string[] = [];

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("importa righe valide e riporta errori per riga", async () => {
    _resetRateLimitForTests();
    const stamp = Date.now().toString(36);
    const email = `csv-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner",
      email,
      password: "TestPass123!",
      workspaceName: `CSV ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    const csv = [
      "nome,indirizzo,citta,cap,timezone,contatti",
      "PV Ok,Via 1,Milano,20100,Europe/Rome,",
      ",,,,", // blank skip
      "X,,,,,", // nome troppo corto
    ].join("\n");

    const result = await importStoresFromCsv({
      tenantId,
      role: Role.owner,
      csvText: csv,
    });
    expect(result.imported).toBe(1);
    expect(result.errors.some((e) => e.line === 4)).toBe(true);

    const tooMany = Array.from({ length: STORE_CSV_MAX_ROWS + 1 }, (_, i) =>
      `PV ${i},,Roma,,,`,
    );
    const capped = await importStoresFromCsv({
      tenantId,
      role: Role.owner,
      csvText: ["nome,indirizzo,citta,cap,timezone,contatti", ...tooMany].join(
        "\n",
      ),
    });
    expect(capped.imported).toBe(0);
    expect(capped.errors[0]?.message).toMatch(/Massimo/);
  });
});
