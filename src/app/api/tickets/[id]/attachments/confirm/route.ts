import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { confirmAttachmentUpload } from "@/application/attachments/confirm-upload";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { ForbiddenError } from "@/domain/rbac/guards";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }
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
    const result = await confirmAttachmentUpload({
      tenantId: session.tenantId,
      actorUserId: session.user.id,
      role: session.role,
      membership,
      data: { ...body, ticketId },
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      attachment: {
        id: result.attachment.id,
        mime: result.attachment.mime,
        sizeBytes: result.attachment.sizeBytes,
        storageKey: result.attachment.storageKey,
      },
    });
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
