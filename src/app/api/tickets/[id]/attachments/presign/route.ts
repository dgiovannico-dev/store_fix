import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requestAttachmentPresign } from "@/application/attachments/request-presign";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { ForbiddenError } from "@/domain/rbac/guards";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const limited = await rejectIfRateLimited(
    `attachment-presign:${session.tenantId}:${session.user.id}`,
    RATE_LIMIT.attachmentPresign,
  );
  if (limited) return limited;

  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) {
    return NextResponse.json({ error: await actionError("membershipMissing") }, { status: 403 });
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
      return NextResponse.json(
        { error: await actionResultError(result) },
        { status: 400 },
      );
    }
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json(
        { error: await actionResultError({ message: e.message, code: e.code }) },
        { status: 403 },
      );
    }
    throw e;
  }
}
