import { Role, type Membership } from "@prisma/client";

const HQ_ROLES: Role[] = [
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
  Role.viewer_finance,
];

/** HQ / empty storeIds = all stores del tenant. */
export function isHqAllStores(membership: Pick<Membership, "role" | "storeIds">): boolean {
  if (HQ_ROLES.includes(membership.role)) return true;
  return membership.storeIds.length === 0 && membership.role !== Role.vendor;
}

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
