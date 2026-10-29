import {
  suggestVendorHeuristic,
  type VendorSuggestion,
} from "@/domain/ai/suggest-vendor";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { ForbiddenError } from "@/domain/rbac/guards";
import { listVendors } from "@/domain/vendors/vendor-service";
import { requireTenantId } from "@/infrastructure/db/tenant-scope";

export async function suggestTicketVendor(input: {
  tenantId: string;
  userId: string;
  storeId: string;
  category: string;
}): Promise<VendorSuggestion | null> {
  requireTenantId(input.tenantId);
  const membership = await getActiveMembership(input.userId, input.tenantId);
  if (!membership) throw new ForbiddenError();
  if (!canAccessStore(membership, input.storeId)) {
    throw new ForbiddenError("Store fuori scope");
  }

  const vendors = await listVendors(input.tenantId);
  return suggestVendorHeuristic({
    storeId: input.storeId,
    category: input.category,
    vendors: vendors.map((v) => ({
      id: v.id,
      name: v.name,
      trades: v.trades,
      storeCoverageIds: v.storeCoverageIds,
    })),
  });
}
