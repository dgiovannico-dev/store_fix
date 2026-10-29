import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { actionError } from "@/i18n/action-errors";
import { listNotificationsForUser } from "@/application/notifications/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
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
