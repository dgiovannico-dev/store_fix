import { Role, type Membership } from "@prisma/client";

const HQ_ROLES: Role[] = [
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
  Role.viewer_finance,
];

/** Solo ruoli HQ vedono tutti gli store del tenant. */
export function isHqAllStores(
  membership: Pick<Membership, "role" | "storeIds">,
): boolean {
  return HQ_ROLES.includes(membership.role);
}

/**
 * Scope store: HQ → all; vendor → none; store role senza storeIds → none
 * (non più "all" — anti-IDOR R1.2).
 */
export function scopedStoreIds(
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">,
): string[] | "all" | "none" {
  if (membership.deletedAt) return "none";
  if (membership.role === Role.vendor) return "none";
  if (isHqAllStores(membership)) return "all";
  if (membership.storeIds.length === 0) return "none";
  return membership.storeIds;
}

export function canAccessStore(
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">,
  storeId: string,
): boolean {
  const scope = scopedStoreIds(membership);
  if (scope === "none") return false;
  if (scope === "all") return true;
  return scope.includes(storeId);
}

/** Prisma where fragment for Store queries. */
export function storeScopeWhere(
  membership: Pick<Membership, "role" | "storeIds" | "deletedAt">,
): { id?: { in: string[] } } {
  const scope = scopedStoreIds(membership);
  if (scope === "all") return {};
  if (scope === "none") return { id: { in: [] } };
  return { id: { in: scope } };
}
