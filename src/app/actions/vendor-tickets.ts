"use server";

import { revalidatePath } from "next/cache";
import { TicketStatus } from "@prisma/client";
import { auth } from "@/auth";
import {
  completeVendorWork,
  transitionVendorStatus,
} from "@/application/tickets/vendor-ticket-lifecycle";
import { getActiveMembership } from "@/domain/memberships/membership-service";

export type VendorActionState = { error?: string; ok?: boolean };

async function ctx() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) return null;
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) return null;
  return { session, membership };
}

export async function vendorStatusAction(
  _prev: VendorActionState,
  formData: FormData,
): Promise<VendorActionState> {
  const c = await ctx();
  if (!c) return { error: "Accesso richiesto" };
  const ticketId = String(formData.get("ticketId") ?? "");
  const to = String(formData.get("to") ?? "") as TicketStatus;
  const result = await transitionVendorStatus({
    tenantId: c.session.tenantId!,
    ticketId,
    actorUserId: c.session.user!.id!,
    role: c.session.role!,
    membership: c.membership,
    to,
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/vendor/inbox");
  revalidatePath(`/vendor/tickets/${ticketId}`);
  return { ok: true };
}

export async function vendorCompleteAction(
  _prev: VendorActionState,
  formData: FormData,
): Promise<VendorActionState> {
  const c = await ctx();
  if (!c) return { error: "Accesso richiesto" };
  const ticketId = String(formData.get("ticketId") ?? "");
  const result = await completeVendorWork({
    tenantId: c.session.tenantId!,
    ticketId,
    actorUserId: c.session.user!.id!,
    role: c.session.role!,
    membership: c.membership,
    data: {
      actualCost: formData.get("actualCost"),
      estimatedCost: formData.get("estimatedCost") || null,
      completionReport: formData.get("completionReport"),
    },
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/vendor/inbox");
  revalidatePath(`/vendor/tickets/${ticketId}`);
  revalidatePath(`/app/tickets/${ticketId}`);
  return { ok: true };
}
