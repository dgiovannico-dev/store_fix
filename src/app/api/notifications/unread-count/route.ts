import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { countUnreadNotifications } from "@/application/notifications/queries";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { actionError } from "@/i18n/action-errors";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const limited = await rejectIfRateLimited(
    `notifications:${session.tenantId}:${session.user.id}`,
    RATE_LIMIT.notifications,
  );
  if (limited) return limited;

  const count = await countUnreadNotifications(
    session.tenantId,
    session.user.id,
  );
  return NextResponse.json({ count });
}
