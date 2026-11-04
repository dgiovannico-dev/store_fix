"use server";

import { revalidatePath } from "next/cache";
import {
  createVendor,
  softDeleteVendor,
  updateVendor,
} from "@/application/vendors/vendor-service";
import { actionError } from "@/i18n/action-errors";
import { actionResultError } from "@/i18n/domain-errors";
import { sessionTenant } from "@/lib/auth/session-tenant";

function tradesFromForm(formData: FormData): string[] {
  const raw = String(formData.get("trades") ?? "");
  return raw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function coverageFromForm(formData: FormData): string[] {
  return formData
    .getAll("storeCoverageIds")
    .map(String)
    .filter(Boolean);
}

export async function createVendorAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await sessionTenant();
  if (!session) return { error: await actionError("accessRequired") };

  const result = await createVendor({
    tenantId: session.tenantId!,
    role: session.role!,
    data: {
      name: formData.get("name"),
      email: formData.get("email") || null,
      phone: formData.get("phone") || null,
      trades: tradesFromForm(formData),
      storeCoverageIds: coverageFromForm(formData),
    },
  });
  if (!result.ok) return { error: await actionResultError(result) };
  revalidatePath("/app/vendors");
  return {};
}

export async function updateVendorAction(
  vendorId: string,
  formData: FormData,
): Promise<void> {
  const session = await sessionTenant();
  if (!session) return;
  await updateVendor({
    tenantId: session.tenantId!,
    role: session.role!,
    vendorId,
    data: {
      name: formData.get("name"),
      email: formData.get("email") || null,
      phone: formData.get("phone") || null,
      trades: tradesFromForm(formData),
      storeCoverageIds: coverageFromForm(formData),
    },
  });
  revalidatePath("/app/vendors");
  revalidatePath(`/app/vendors/${vendorId}`);
}

export async function deleteVendorAction(vendorId: string): Promise<void> {
  const session = await sessionTenant();
  if (!session) return;
  await softDeleteVendor({
    tenantId: session.tenantId!,
    role: session.role!,
    vendorId,
  });
  revalidatePath("/app/vendors");
}
