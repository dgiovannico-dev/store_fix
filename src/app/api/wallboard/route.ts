import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  listWallboardTicketsPage,
  WALLBOARD_PAGE_SIZE,
} from "@/application/dashboard/wallboard-query";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { actionError } from "@/i18n/action-errors";

/** Paginated wallboard cards — HQ only. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.tenantId || !session.role) {
    return NextResponse.json(
      { error: await actionError("unauthorized") },
      { status: 401 },
    );
  }
  if (!can(session.role, RbacAction.dashboardHq)) {
    return NextResponse.json(
      { error: await actionError("unauthorized") },
      { status: 403 },
    );
  }

  const limited = await rejectIfRateLimited(
    `wallboard:${session.tenantId}:${session.user?.id ?? "anon"}`,
    RATE_LIMIT.notifications,
  );
  if (limited) return limited;

  const url = new URL(req.url);
  const skipRaw = Number(url.searchParams.get("skip") ?? "0");
  const takeRaw = Number(
    url.searchParams.get("take") ?? String(WALLBOARD_PAGE_SIZE),
  );
  const skip = Number.isFinite(skipRaw) ? Math.max(0, Math.floor(skipRaw)) : 0;
  const take = Number.isFinite(takeRaw)
    ? Math.floor(takeRaw)
    : WALLBOARD_PAGE_SIZE;

  const page = await listWallboardTicketsPage(session.tenantId, { skip, take });
  return NextResponse.json(page);
}
