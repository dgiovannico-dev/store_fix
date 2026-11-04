import { listAssets } from "@/application/assets/asset-service";
import { getActiveMembership } from "@/application/memberships/membership-service";
import { listStores } from "@/application/stores/store-service";
import type { Role } from "@prisma/client";

export type TicketFormStoreOpt = { id: string; name: string };
export type TicketFormAssetOpt = { id: string; label: string; storeId: string };

export type TicketFormOptions = {
  stores: TicketFormStoreOpt[];
  assets: TicketFormAssetOpt[];
};

/** Shared loader for new-ticket RSC + API (R4.4). */
export async function loadTicketFormOptions(input: {
  userId: string;
  tenantId: string;
  role: Role;
}): Promise<TicketFormOptions | { error: "membershipMissing" }> {
  const membership = await getActiveMembership(input.userId, input.tenantId);
  if (!membership) return { error: "membershipMissing" };

  const [stores, assets] = await Promise.all([
    listStores(input.tenantId, membership),
    listAssets({ tenantId: input.tenantId, membership }),
  ]);

  return {
    stores: stores.map((s) => ({ id: s.id, name: s.name })),
    assets: assets.map((a) => ({
      id: a.id,
      label: a.label,
      storeId: a.storeId,
    })),
  };
}
