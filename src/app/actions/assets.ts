"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createAsset, softDeleteAsset } from "@/domain/assets/asset-service";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { actionError } from "@/i18n/action-errors";

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

export async function createAssetAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const c = await ctx();
  if (!c) return { error: await actionError("accessRequired") };

  const result = await createAsset({
    tenantId: c.session.tenantId!,
    role: c.session.role!,
    membership: c.membership,
    data: {
      storeId: formData.get("storeId"),
      category: formData.get("category"),
      label: formData.get("label"),
      brandModel: formData.get("brandModel") || null,
      location: formData.get("location") || null,
      notes: formData.get("notes") || null,
      preferredVendorId: formData.get("preferredVendorId") || null,
      serial: formData.get("serial") || null,
    },
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/app/assets");
  return {};
}

export async function deleteAssetAction(assetId: string): Promise<void> {
  const c = await ctx();
  if (!c) return;
  await softDeleteAsset({
    tenantId: c.session.tenantId!,
    role: c.session.role!,
    membership: c.membership,
    assetId,
  });
  revalidatePath("/app/assets");
}
