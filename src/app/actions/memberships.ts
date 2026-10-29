"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  softDisableMembership,
  updateMembership,
} from "@/domain/memberships/membership-service";

export async function updateMembershipAction(
  membershipId: string,
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.tenantId || !session.role) return;

  const storeIds = formData.getAll("storeIds").map(String).filter(Boolean);
  const vendorIdRaw = String(formData.get("vendorId") ?? "");
  await updateMembership({
    tenantId: session.tenantId,
    actorRole: session.role,
    actorUserId: session.user?.id,
    membershipId,
    data: {
      storeIds,
      vendorId: vendorIdRaw ? vendorIdRaw : null,
    },
  });
  revalidatePath("/app/settings/members");
  revalidatePath("/app/settings/audit");
}

export async function disableMembershipAction(
  membershipId: string,
): Promise<void> {
  const session = await auth();
  if (!session?.tenantId || !session.role) return;
  await softDisableMembership({
    tenantId: session.tenantId,
    actorRole: session.role,
    actorUserId: session.user?.id,
    membershipId,
  });
  revalidatePath("/app/settings/members");
  revalidatePath("/app/settings/audit");
}
