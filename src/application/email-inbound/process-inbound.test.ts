import { afterAll, describe, expect, it } from "vitest";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { Role } from "@prisma/client";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import { processInboundEmail } from "./process-inbound";

describe("processInboundEmail", () => {
  let tenantId = "";
  let slug = "";
  const emails: string[] = [];

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
    for (const email of emails) {
      await prisma.session.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    }
    await prisma.$disconnect();
  });

  it("crea ticket e deduplica Message-ID", async () => {
    const stamp = Date.now().toString(36);
    const email = `inb-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner Inb",
      email,
      password: "TestPass123!",
      workspaceName: `Inb ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });
    slug = tenant.slug;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Inbound", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const mid = `<msg-${stamp}@test.local>`;
    const first = await processInboundEmail({
      messageId: mid,
      tenantSlug: slug,
      subject: "[store:PV Inbound] Frigo caldo critico",
      text: "Banco frigo in allarme",
      from: "staff@pv.it",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.duplicate).toBeFalsy();

    const second = await processInboundEmail({
      messageId: mid,
      tenantSlug: slug,
      subject: "[store:PV Inbound] Frigo caldo critico",
      text: "retry",
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.duplicate).toBe(true);
    expect(second.ticketId).toBe(first.ticketId);
  });
});
