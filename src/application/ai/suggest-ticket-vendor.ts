import {
  suggestVendorHeuristic,
  type VendorSuggestion,
} from "@/domain/ai/suggest-vendor";
import { getActiveMembership } from "@/application/memberships/membership-service";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { ForbiddenError } from "@/domain/rbac/guards";
import { listVendors } from "@/application/vendors/vendor-service";
import { recordAiInvocation } from "@/infrastructure/ai/record-ai-invocation";
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
    throw new ForbiddenError(undefined, "storeOutOfScope");
  }

  const vendors = await listVendors(input.tenantId);
  const suggestion = suggestVendorHeuristic({
    storeId: input.storeId,
    category: input.category,
    vendors: vendors.map((v) => ({
      id: v.id,
      name: v.name,
      trades: v.trades,
      storeCoverageIds: v.storeCoverageIds,
    })),
  });
  void recordAiInvocation({
    tenantId: input.tenantId,
    userId: input.userId,
    feature: "suggest_vendor",
    provider: suggestion?.source ?? "heuristic",
    ok: true,
  });
  return suggestion;
}
