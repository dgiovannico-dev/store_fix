import { Role } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";
import { _resetRateLimitForTests } from "@/infrastructure/rate-limit";
import { domainErrorFor } from "@/i18n/domain-errors";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { importStoresFromCsv, STORE_CSV_MAX_ROWS } from "./csv-import";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

describe("importStoresFromCsv", () => {
  const tenantIds: string[] = [];
  const emails: string[] = [];

  afterAll(async () => {
    for (const tid of tenantIds) await cleanupTenant(tid);
    for (const email of emails) {
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("importa righe valide e riporta errori per codice (no copy IT in domain)", async () => {
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
    const tenantId = signup.tenantId;
    tenantIds.push(tenantId);

    const csv = [
      "nome,indirizzo,citta,cap,timezone,contatti",
      "PV Ok,Via 1,Milano,20100,Europe/Rome,",
      ",,,,", // blank skip
      "X,,,,,", // nome troppo corto → storeNameRequired
    ].join("\n");

    const result = await importStoresFromCsv({
      tenantId,
      role: Role.owner,
      csvText: csv,
    });
    expect(result.imported).toBe(1);
    const rowErr = result.errors.find((e) => e.line === 4);
    expect(rowErr?.code).toBe("storeNameRequired");
    expect(rowErr?.message).toBeUndefined();

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
    expect(capped.errors[0]?.code).toBe("csvTooManyRows");
    expect(capped.errors[0]?.params).toEqual({
      max: String(STORE_CSV_MAX_ROWS),
      found: String(STORE_CSV_MAX_ROWS + 1),
    });
    expect(
      domainErrorFor("csvTooManyRows", "en", capped.errors[0]?.params),
    ).toMatch(/Maximum/);
  });

  it("segnala header mancante con code + params", async () => {
    _resetRateLimitForTests();
    const stamp = Date.now().toString(36);
    const email = `csv-hdr-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner",
      email,
      password: "TestPass123!",
      workspaceName: `CSV HDR ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    const tid = signup.tenantId;
    tenantIds.push(tid);

    const missing = await importStoresFromCsv({
      tenantId: tid,
      role: Role.owner,
      csvText: "indirizzo,citta\nVia 1,Roma\n",
    });
    expect(missing.imported).toBe(0);
    expect(missing.errors[0]?.code).toBe("csvHeaderMissing");
    expect(missing.errors[0]?.params).toEqual({ header: "nome" });
  });
});
