"use server";

import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { createInvite } from "@/domain/invites/invite";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { actionError } from "@/i18n/action-errors";

export type InviteFromTicketState = {
  ok?: boolean;
  error?: string;
};

export async function inviteFromTicketAction(
  _prev: InviteFromTicketState,
  formData: FormData,
): Promise<InviteFromTicketState> {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return { error: await actionError("accessRequired") };
  }
  const email = String(formData.get("email") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "store_manager");
  const storeId = String(formData.get("storeId") ?? "");
  const vendorId = String(formData.get("vendorId") ?? "") || null;
  const role =
    roleRaw === "vendor" ? Role.vendor : Role.store_manager;
  const prefs = await getTenantI18nPrefs(session.tenantId);
  const result = await createInvite({
    tenantId: session.tenantId,
    actorRole: session.role,
    actorUserId: session.user.id,
    email,
    role,
    storeIds: role === Role.store_manager && storeId ? [storeId] : [],
    vendorId: role === Role.vendor ? vendorId : null,
    locale: prefs.locale,
  });
  if (!result.ok) {
    return { error: result.message ?? (await actionError("invalidJson")) };
  }
  return { ok: true };
}
