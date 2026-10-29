import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/infrastructure/db/prisma";
import {
  countActiveDefaultSla,
  DEFAULT_SLA_POLICIES,
  ensureDefaultSlaPolicies,
} from "./defaults";

describe("ensureDefaultSlaPolicies", () => {
  let tenantId = "";

  afterAll(async () => {
    if (tenantId) {
      await prisma.slaPolicy.deleteMany({ where: { tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("è idempotente e crea 3 policy", async () => {
    const tenant = await prisma.tenant.create({
      data: {
        name: "SLA Test",
        slug: `sla-${Date.now().toString(36)}`,
      },
    });
    tenantId = tenant.id;

    const n1 = await ensureDefaultSlaPolicies(prisma, tenantId);
    expect(n1).toBe(DEFAULT_SLA_POLICIES.length);
    const n2 = await ensureDefaultSlaPolicies(prisma, tenantId);
    expect(n2).toBe(0);
    expect(await countActiveDefaultSla(prisma, tenantId)).toBe(3);
  });
});
