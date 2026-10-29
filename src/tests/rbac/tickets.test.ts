import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createTicket } from "@/application/tickets/create-ticket";
import {
  assignTicket,
  cancelTicket,
  triageTicket,
} from "@/application/tickets/transition-ticket";
import { acceptInvite, createInvite } from "@/domain/invites/invite";
import { updateMembership } from "@/domain/memberships/membership-service";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { ForbiddenError } from "@/domain/rbac/guards";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { createVendor } from "@/domain/vendors/vendor-service";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";

/** T2.29 — matrice critica ticket vs RBAC.md */
describe("RBAC ticket actions", () => {
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

  it("allow/deny open, triage, assign, cancel per ruolo", async () => {
    expect(can(Role.store_staff, RbacAction.openTicket)).toBe(true);
    expect(can(Role.vendor, RbacAction.openTicket)).toBe(false);
    expect(can(Role.store_manager, RbacAction.triageTicket)).toBe(false);
    expect(can(Role.ops_coordinator, RbacAction.triageTicket)).toBe(true);
    expect(can(Role.viewer_finance, RbacAction.cancelTicket)).toBe(false);
    expect(can(Role.owner, RbacAction.cancelTicket)).toBe(true);

    const stamp = Date.now().toString(36);
    const ownerEmail = `rbac-o-${stamp}@test.facilityflow.local`;
    emails.push(ownerEmail);
    const signup = await signupHqOwner({
      name: "Owner Rbac",
      email: ownerEmail,
      password: "TestPass123!",
      workspaceName: `Rbac ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV Rbac", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const vendor = await createVendor({
      tenantId,
      role: Role.owner,
      data: {
        name: "Frigo Rbac",
        email: `vrbac-${stamp}@test.facilityflow.local`,
        trades: ["frigo"],
      },
    });
    expect(vendor.ok).toBe(true);
    if (!vendor.ok) return;

    const staffEmail = `staff-${stamp}@test.facilityflow.local`;
    emails.push(staffEmail);
    const inv = await createInvite({
      tenantId,
      actorRole: Role.owner,
      actorUserId: signup.userId,
      email: staffEmail,
      role: Role.store_staff,
    });
    expect(inv.ok).toBe(true);
    if (!inv.ok) return;
    const raw = inv.acceptUrl.split("/invite/")[1]!;
    await acceptInvite({
      rawToken: raw,
      name: "Staff",
      password: "StaffPass123!",
    });
    const staffMem = await prisma.membership.findFirst({
      where: { tenantId, user: { email: staffEmail } },
    });
    expect(staffMem).toBeTruthy();
    if (!staffMem) return;
    await updateMembership({
      tenantId,
      actorRole: Role.owner,
      membershipId: staffMem.id,
      data: { storeIds: [store.store.id] },
    });

    const opened = await createTicket({
      tenantId,
      actorUserId: staffMem.userId,
      role: Role.store_staff,
      membership: {
        role: Role.store_staff,
        storeIds: [store.store.id],
        deletedAt: null,
      },
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.normal,
        description: "Guasto RBAC store staff",
      },
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    await expect(
      createTicket({
        tenantId,
        actorUserId: signup.userId,
        role: Role.vendor,
        membership: {
          role: Role.vendor,
          storeIds: [],
          deletedAt: null,
        },
        data: {
          storeId: store.store.id,
          category: "frigo",
          priority: TicketPriority.low,
          description: "Vendor non apre",
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const denyStaffTriage = await triageTicket({
      tenantId,
      ticketId: opened.ticket.id,
      actorUserId: staffMem.userId,
      role: Role.store_staff,
    });
    expect(denyStaffTriage.ok).toBe(false);

    const triage = await triageTicket({
      tenantId,
      ticketId: opened.ticket.id,
      actorUserId: signup.userId,
      role: Role.ops_coordinator,
      note: "Nota HQ interna",
    });
    expect(triage.ok).toBe(true);
    if (!triage.ok) return;

    const denyStaffAssign = await assignTicket({
      tenantId,
      ticketId: opened.ticket.id,
      actorUserId: staffMem.userId,
      role: Role.store_manager,
      vendorId: vendor.vendor.id,
    });
    expect(denyStaffAssign.ok).toBe(false);

    const assign = await assignTicket({
      tenantId,
      ticketId: opened.ticket.id,
      actorUserId: signup.userId,
      role: Role.admin_hq,
      vendorId: vendor.vendor.id,
      priority: TicketPriority.high,
    });
    expect(assign.ok).toBe(true);
    if (!assign.ok) return;
    expect(assign.ticket.status).toBe(TicketStatus.assigned);

    const denyStaffCancel = await cancelTicket({
      tenantId,
      ticketId: opened.ticket.id,
      actorUserId: staffMem.userId,
      role: Role.store_staff,
      reason: "Non posso",
    });
    expect(denyStaffCancel.ok).toBe(false);

    const denyFinanceCancel = await cancelTicket({
      tenantId,
      ticketId: opened.ticket.id,
      actorUserId: signup.userId,
      role: Role.viewer_finance,
      reason: "Finance no",
    });
    expect(denyFinanceCancel.ok).toBe(false);

    const cancel = await cancelTicket({
      tenantId,
      ticketId: opened.ticket.id,
      actorUserId: signup.userId,
      role: Role.owner,
      reason: "Annullato da owner RBAC",
    });
    expect(cancel.ok).toBe(true);
  });
});
