import { Role, TicketPriority } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { createTicket } from "@/application/tickets/create-ticket";
import { ensureDefaultSlaPolicies } from "@/domain/sla/defaults";
import { createStore } from "@/domain/stores/store-service";
import { signupHqOwner } from "@/domain/tenancy/signup";
import { prisma } from "@/infrastructure/db/prisma";
import { cleanupTenant } from "@/test-utils/cleanup-tenant";
import {
  ATTACHMENT_GC_GRACE_DAYS_DEFAULT,
  gcGraceCutoff,
  gcSoftDeletedAttachments,
} from "./gc-soft-deleted";

describe("gcSoftDeletedAttachments", () => {
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

  it("DeleteObject solo oltre grace; idempotente via storagePurgedAt", async () => {
    const stamp = Date.now().toString(36);
    const email = `att-gc-${stamp}@test.facilityflow.local`;
    emails.push(email);
    const signup = await signupHqOwner({
      name: "Owner AttGc",
      email,
      password: "TestPass123!",
      workspaceName: `AttGc ${stamp}`,
    });
    expect(signup.ok).toBe(true);
    if (!signup.ok) return;
    tenantId = signup.tenantId;
    await ensureDefaultSlaPolicies(prisma, tenantId);

    const store = await createStore({
      tenantId,
      role: Role.owner,
      data: { name: "PV AttGc", timezone: "Europe/Rome" },
    });
    expect(store.ok).toBe(true);
    if (!store.ok) return;

    const membership = {
      role: Role.owner,
      storeIds: [] as string[],
      deletedAt: null,
    };

    const created = await createTicket({
      tenantId,
      actorUserId: signup.userId,
      role: Role.owner,
      membership,
      data: {
        storeId: store.store.id,
        category: "frigo",
        priority: TicketPriority.normal,
        description: "GC allegati soft-delete",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const now = new Date();
    const oldDeleted = new Date(now.getTime());
    oldDeleted.setUTCDate(
      oldDeleted.getUTCDate() - (ATTACHMENT_GC_GRACE_DAYS_DEFAULT + 2),
    );
    const recentDeleted = new Date(now.getTime());
    recentDeleted.setUTCDate(recentDeleted.getUTCDate() - 1);

    const oldAtt = await prisma.attachment.create({
      data: {
        tenantId,
        ticketId: created.ticket.id,
        storageKey: `tenants/${tenantId}/tickets/${created.ticket.id}/old.jpg`,
        mime: "image/jpeg",
        sizeBytes: 100,
        deletedAt: oldDeleted,
      },
    });
    const recentAtt = await prisma.attachment.create({
      data: {
        tenantId,
        ticketId: created.ticket.id,
        storageKey: `tenants/${tenantId}/tickets/${created.ticket.id}/new.jpg`,
        mime: "image/jpeg",
        sizeBytes: 100,
        deletedAt: recentDeleted,
      },
    });

    const deletedKeys: string[] = [];
    const dry = await gcSoftDeletedAttachments({
      now,
      dryRun: true,
      deleteObject: async (key) => {
        deletedKeys.push(key);
      },
    });
    expect(dry.dryRun).toBe(true);
    expect(dry.candidates).toBeGreaterThanOrEqual(1);
    expect(deletedKeys).toHaveLength(0);

    const first = await gcSoftDeletedAttachments({
      now,
      deleteObject: async (key) => {
        deletedKeys.push(key);
      },
    });
    expect(first.purged).toBeGreaterThanOrEqual(1);
    expect(deletedKeys).toContain(oldAtt.storageKey);
    expect(deletedKeys).not.toContain(recentAtt.storageKey);

    const refreshedOld = await prisma.attachment.findUniqueOrThrow({
      where: { id: oldAtt.id },
    });
    expect(refreshedOld.storagePurgedAt).not.toBeNull();
    const refreshedRecent = await prisma.attachment.findUniqueOrThrow({
      where: { id: recentAtt.id },
    });
    expect(refreshedRecent.storagePurgedAt).toBeNull();

    deletedKeys.length = 0;
    const second = await gcSoftDeletedAttachments({
      now,
      deleteObject: async (key) => {
        deletedKeys.push(key);
      },
    });
    expect(second.purged).toBe(0);
    expect(deletedKeys).toHaveLength(0);

    expect(gcGraceCutoff(now).getTime()).toBeLessThan(now.getTime());
  });
});
