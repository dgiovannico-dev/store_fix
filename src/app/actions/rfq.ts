"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  awardQuoteBid,
  createQuoteRequest,
  submitQuoteBid,
} from "@/application/rfq/rfq-service";
import { prisma } from "@/infrastructure/db/prisma";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";

async function sessionCtx() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) return null;
  return session;
}

export async function createQuoteRequestAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  const session = await sessionCtx();
  if (!session) return { error: await actionError("accessRequired") };

  const vendorIds = formData
    .getAll("vendorIds")
    .map(String)
    .filter(Boolean);

  const result = await createQuoteRequest({
    tenantId: session.tenantId!,
    role: session.role!,
    actorUserId: session.user!.id!,
    data: {
      title: formData.get("title"),
      notes: formData.get("notes") || null,
      ticketId: formData.get("ticketId") || null,
      vendorIds,
    },
  });
  if (!result.ok) return { error: await actionResultError(result) };
  revalidatePath("/app/rfq");
  revalidatePath(`/app/rfq/${result.request.id}`);
  if (result.request.ticketId) {
    revalidatePath(`/app/tickets/${result.request.ticketId}`);
  }
  return { id: result.request.id };
}

export async function submitQuoteBidAction(
  bidId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await sessionCtx();
  if (!session) return { error: await actionError("accessRequired") };

  const membership = await prisma.membership.findFirst({
    where: {
      tenantId: session.tenantId!,
      userId: session.user!.id!,
      deletedAt: null,
    },
  });
  if (!membership) return { error: await actionError("membershipMissing") };

  const result = await submitQuoteBid({
    tenantId: session.tenantId!,
    role: session.role!,
    membership,
    bidId,
    data: {
      amountEur: formData.get("amountEur"),
      note: formData.get("note") || null,
    },
  });
  if (!result.ok) return { error: await actionResultError(result) };
  revalidatePath("/vendor/rfq");
  revalidatePath(`/vendor/rfq/${result.bid.quoteRequestId}`);
  return {};
}

export async function awardQuoteBidAction(
  requestId: string,
  bidId: string,
): Promise<{ error?: string }> {
  const session = await sessionCtx();
  if (!session) return { error: await actionError("accessRequired") };

  const result = await awardQuoteBid({
    tenantId: session.tenantId!,
    role: session.role!,
    actorUserId: session.user!.id!,
    requestId,
    bidId,
  });
  if (!result.ok) return { error: await actionResultError(result) };
  revalidatePath("/app/rfq");
  revalidatePath(`/app/rfq/${requestId}`);
  return {};
}
