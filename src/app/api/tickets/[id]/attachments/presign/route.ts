import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requestAttachmentPresign } from "@/application/attachments/request-presign";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { ForbiddenError } from "@/domain/rbac/guards";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) {
    return NextResponse.json({ error: "no membership" }, { status: 403 });
  }

  const { id: ticketId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = await requestAttachmentPresign({
      tenantId: session.tenantId,
      actorUserId: session.user.id,
      role: session.role,
      membership,
      data: { ...body, ticketId },
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
}
