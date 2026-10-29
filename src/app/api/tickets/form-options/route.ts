import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listAssets } from "@/domain/assets/asset-service";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { listStores } from "@/domain/stores/store-service";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { actionError } from "@/i18n/action-errors";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const limited = await rejectIfRateLimited(
    `form-options:${session.tenantId}:${session.user.id}`,
    RATE_LIMIT.formOptions,
  );
  if (limited) return limited;

  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) {
    return NextResponse.json({ error: await actionError("membershipMissing") }, { status: 403 });
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
