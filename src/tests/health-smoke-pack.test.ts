/**
 * S5/E14 — pacchetto smoke health unificato (live / ready / alias).
 * Sostituisce health-routes.test.ts + health.test.ts.
 */
import { afterAll, describe, expect, it } from "vitest";
import { GET as getLive } from "@/app/api/health/live/route";
import { GET as getReady } from "@/app/api/health/ready/route";
import { GET as getAlias } from "@/app/api/health/route";
import { getLiveHealth, getReadyHealth } from "@/infrastructure/health";
import { prisma } from "@/infrastructure/db/prisma";

const SECRET_RE = /password|secret|DATABASE|postgresql:\/\//i;

describe("health smoke pack", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("live probe puro: shape fissa, no secret", () => {
    const body = getLiveHealth(new Date("2026-10-29T00:00:00.000Z"));
    expect(body).toEqual({
      status: "ok",
      check: "live",
      service: "facilityflow",
      timestamp: "2026-10-29T00:00:00.000Z",
    });
    expect(JSON.stringify(body)).not.toMatch(SECRET_RE);
  });

  it("HTTP live 200 senza db nel payload", async () => {
    const res = await getLive();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.check).toBe("live");
    expect(body).not.toHaveProperty("db");
    expect(JSON.stringify(body)).not.toMatch(SECRET_RE);
  });

  it("ready probe + HTTP ready/alias allineati su DB up", async () => {
    const { ok, body } = await getReadyHealth();
    expect(ok).toBe(true);
    expect(body.status).toBe("ok");
    if (body.status === "ok") expect(body.db).toBe("up");
    expect(JSON.stringify(body)).not.toMatch(SECRET_RE);

    const ready = await getReady();
    const alias = await getAlias();
    expect(ready.status).toBe(200);
    expect(alias.status).toBe(200);
    const a = await ready.json();
    const b = await alias.json();
    expect(a.check).toBe("ready");
    expect(a.db).toBe("up");
    expect(b.db).toBe("up");
    expect(JSON.stringify(a)).not.toMatch(SECRET_RE);
  });
});
