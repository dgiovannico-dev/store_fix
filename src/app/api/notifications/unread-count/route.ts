import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { countUnreadNotifications } from "@/application/notifications/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const count = await countUnreadNotifications(
    session.tenantId,
    session.user.id,
  );
  return NextResponse.json({ count });
}
