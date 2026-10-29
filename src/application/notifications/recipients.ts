import { Role } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export const HQ_ROLES: Role[] = [
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
];

export type Recipient = { userId: string; email: string };

export async function resolveHqRecipients(
  tenantId: string,
): Promise<Recipient[]> {
  requireTenantId(tenantId);
  const memberships = await prisma.membership.findMany({
    where: { tenantId, deletedAt: null, role: { in: HQ_ROLES } },
    include: { user: { select: { id: true, email: true } } },
  });
  const byUser = new Map<string, string>();
  for (const m of memberships) {
    if (m.user.email) byUser.set(m.user.id, m.user.email);
  }
  return [...byUser.entries()].map(([userId, email]) => ({ userId, email }));
}

/** Store membership dello store (+ HQ). */
export async function resolveStoreRecipients(
  tenantId: string,
  storeId: string,
): Promise<Recipient[]> {
  requireTenantId(tenantId);
  const memberships = await prisma.membership.findMany({
    where: {
      tenantId,
      deletedAt: null,
      role: { in: [Role.store_manager, Role.store_staff, ...HQ_ROLES] },
    },
    include: { user: { select: { id: true, email: true } } },
  });
  const out: Recipient[] = [];
  for (const m of memberships) {
    if (!m.user.email) continue;
    if (
      HQ_ROLES.includes(m.role) ||
      m.storeIds.length === 0 ||
      m.storeIds.includes(storeId)
    ) {
      out.push({ userId: m.user.id, email: m.user.email });
    }
  }
  return out;
}

export async function resolveVendorRecipients(
  tenantId: string,
  vendorId: string,
): Promise<Recipient[]> {
  requireTenantId(tenantId);
  const memberships = await prisma.membership.findMany({
    where: {
      tenantId,
      vendorId,
      deletedAt: null,
      role: Role.vendor,
    },
    include: { user: { select: { id: true, email: true } } },
  });
  return memberships
    .filter((m) => m.user.email)
    .map((m) => ({ userId: m.user.id, email: m.user.email! }));
}

export function uniqueRecipients(list: Recipient[]): Recipient[] {
  const map = new Map<string, Recipient>();
  for (const r of list) map.set(r.userId, r);
  return [...map.values()];
}
