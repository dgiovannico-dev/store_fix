import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listAssets } from "@/domain/assets/asset-service";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { listStores } from "@/domain/stores/store-service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) {
    return NextResponse.json({ error: "no membership" }, { status: 403 });
  }

  const [stores, assets] = await Promise.all([
    listStores(session.tenantId, membership),
    listAssets({ tenantId: session.tenantId, membership }),
  ]);

  return NextResponse.json({
    stores: stores.map((s) => ({ id: s.id, name: s.name })),
    assets: assets.map((a) => ({
      id: a.id,
      label: a.label,
      storeId: a.storeId,
    })),
  });
}
