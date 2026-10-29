import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markAllNotificationsRead } from "@/application/notifications/queries";
import { checkRateLimitPolicyAsync } from "@/infrastructure/rate-limit-async";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { tooManyRequestsFromLimit } from "@/infrastructure/rate-limit-response";
import { actionError } from "@/i18n/action-errors";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const limit = await checkRateLimitPolicyAsync(
    `notifications:${session.tenantId}:${session.user.id}`,
    RATE_LIMIT.notifications,
  );
  if (!limit.ok) {
    return tooManyRequestsFromLimit(await actionError("tooManyRequests"), limit);
  }

  await markAllNotificationsRead({
    tenantId: session.tenantId,
    userId: session.user.id,
  });
  return NextResponse.json({ ok: true });
}
