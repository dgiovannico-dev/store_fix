import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createTicket } from "@/application/tickets/create-ticket";
import { acceptInvite, createInvite } from "@/domain/invites/invite";
import { updateMembership } from "@/domain/memberships/membership-service";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { createVendor } from "@/domain/vendors/vendor-service";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

/**
 * T2.31 — path dominio Flusso C hard (senza UI).
 * Wall-clock automatico: signup → store → vendor → SLA → invite SM → ticket open.
 * Gate UI &lt;15 min resta checklist umana in docs/qa/FLUSSO_C_S2_TIMING.md.
 */
describe("Flusso C hard timing (domain path)", () => {
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

  it("rete + ticket prova open in &lt; 15 min wall-clock", async () => {
    const t0 = Date.now();
    const stamp = Date.now().toString(36);
    const ownerEmail = `fc-o-${stamp}@test.facilityflow.local`;
    emails.push(ownerEmail);

    const signup = await signupHqOwner({
      name: "Owner FlussoC",
      email: ownerEmail,
      password: "TestPass123!",
      workspaceName: `FlussoC ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;

    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Prova C", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: {
        name: "Vendor Prova C",
        email: `fc-v-${stamp}@test.facilityflow.local`,
      },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const mgrEmail = `fc-m-${stamp}@test.facilityflow.local`;
    emails.push(mgrEmail);
    const inv = await createInvite({
      tenantId,
      actorRole: Role.owner,
      actorUserId: signup.userId,
      email: mgrEmail,
      role: Role.store_manager,
      storeIds: [store.store.id],
    });
    expect(inv.ok).toBe(true);
    if (!inv.ok) return;
    const raw = inv.acceptUrl.split("/invite/")[1]!;
    await acceptInvite({
      rawToken: raw,
      name: "Manager C",
      password: "MgrPass123!",
    });
    const mgrMem = await prisma.membership.findFirst({
      where: { tenantId, user: { email: mgrEmail } },
    });
    expect(mgrMem).toBeTruthy();
    if (!mgrMem) return;
    if (mgrMem.storeIds.length === 0) {
      await updateMembership({
        tenantId,
        actorRole: Role.owner,
        membershipId: mgrMem.id,
        data: { storeIds: [store.store.id] },
      });
    }

    const ticket = await createTicket({
      tenantId,
      actorUserId: mgrMem.userId,
      role: Role.store_manager,
      membership: {
        role: Role.store_manager,
        storeIds: [store.store.id],
        deletedAt: null,
      },
      data: {
        storeId: store.store.id,
        category: "altro",
        priority: TicketPriority.normal,
        description: "Ticket di prova Flusso C hard",
      },
    });
    expect(ticket.ok).toBe(true);
    if (!ticket.ok) return;
    expect(ticket.ticket.status).toBe(TicketStatus.open);

    const elapsedMs = Date.now() - t0;
    const elapsedMin = elapsedMs / 60_000;
    // eslint-disable-next-line no-console
    console.log(
      `[Flusso C domain] wall-clock ${elapsedMs} ms (${elapsedMin.toFixed(3)} min) ticket=${ticket.ticket.id}`,
    );
    expect(elapsedMin).toBeLessThan(15);
  }, 60_000);
});
