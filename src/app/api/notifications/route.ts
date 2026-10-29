import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listNotificationsForUser } from "@/application/notifications/queries";
import { checkRateLimitPolicyAsync } from "@/infrastructure/rate-limit-async";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { tooManyRequestsFromLimit } from "@/infrastructure/rate-limit-response";
import { actionError } from "@/i18n/action-errors";

export async function GET() {
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

  const items = await listNotificationsForUser({
    tenantId: session.tenantId,
    userId: session.user.id,
  });
  return NextResponse.json({
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      ticketId: n.ticketId,
      readAt: n.readAt,
      createdAt: n.createdAt,
      payload: n.payload,
    })),
  });
}
