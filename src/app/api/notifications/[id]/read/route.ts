import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markNotificationRead } from "@/application/notifications/queries";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const limited = await rejectIfRateLimited(
    `notifications:${session.tenantId}:${session.user.id}`,
    RATE_LIMIT.notifications,
  );
  if (limited) return limited;

  const { id } = await ctx.params;
  const result = await markNotificationRead({
    tenantId: session.tenantId,
    userId: session.user.id,
    notificationId: id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: await actionResultError(result) },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
