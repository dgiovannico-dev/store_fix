import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { actionError } from "@/i18n/action-errors";
import { markAllNotificationsRead } from "@/application/notifications/queries";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }
  await markAllNotificationsRead({
    tenantId: session.tenantId,
    userId: session.user.id,
  });
  return NextResponse.json({ ok: true });
}
