import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";
import { markNotificationRead } from "@/application/notifications/queries";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }
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
