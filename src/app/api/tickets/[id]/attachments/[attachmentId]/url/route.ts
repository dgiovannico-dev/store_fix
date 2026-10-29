import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { canAccessStore } from "@/domain/rbac/store-scope";
import { prisma } from "@/infrastructure/db/prisma";
import { rejectIfRateLimited } from "@/infrastructure/rate-limit-guard";
import { RATE_LIMIT } from "@/infrastructure/rate-limit-policies";
import { getSignedGetUrl } from "@/infrastructure/storage/s3";
import { actionError } from "@/i18n/action-errors";

type Ctx = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return NextResponse.json({ error: await actionError("unauthorized") }, { status: 401 });
  }

  const limited = await rejectIfRateLimited(
    `attachment-url:${session.tenantId}:${session.user.id}`,
    RATE_LIMIT.attachmentUrl,
  );
  if (limited) return limited;

  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) {
    return NextResponse.json({ error: await actionError("membershipMissing") }, { status: 403 });
  }

  const { id: ticketId, attachmentId } = await ctx.params;
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, tenantId: session.tenantId, deletedAt: null },
  });
  if (!ticket || !canAccessStore(membership, ticket.storeId)) {
    return NextResponse.json({ error: await actionError("notFound") }, { status: 404 });
  }

  const attachment = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      ticketId,
      tenantId: session.tenantId,
      deletedAt: null,
    },
  });
  if (!attachment) {
    return NextResponse.json({ error: await actionError("notFound") }, { status: 404 });
  }

  const signed = await getSignedGetUrl(attachment.storageKey);
  return NextResponse.json(signed);
}
