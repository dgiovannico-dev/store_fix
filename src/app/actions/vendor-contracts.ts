"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createVendorContract,
  softDeleteVendorContract,
} from "@/domain/vendor-contracts/vendor-contract-service";
import { actionError } from "@/i18n/action-errors";

async function sessionTenant() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) return null;
  return session;
}

export async function createVendorContractAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await sessionTenant();
  if (!session) return { error: await actionError("accessRequired") };

  const feeRaw = String(formData.get("annualFee") ?? "").trim();
  const result = await createVendorContract({
    tenantId: session.tenantId!,
    role: session.role!,
    data: {
      vendorId: formData.get("vendorId"),
      storeId: formData.get("storeId") || null,
      title: formData.get("title"),
      reference: formData.get("reference") || null,
      startsOn: formData.get("startsOn"),
      endsOn: formData.get("endsOn"),
      annualFee: feeRaw === "" ? null : feeRaw,
      notes: formData.get("notes") || null,
    },
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/app/contratti");
  revalidatePath(`/app/vendors/${String(formData.get("vendorId"))}`);
  return {};
}

export async function deleteVendorContractAction(
  contractId: string,
  vendorId?: string,
): Promise<{ error?: string }> {
  const session = await sessionTenant();
  if (!session) return { error: await actionError("accessRequired") };
  const result = await softDeleteVendorContract({
    tenantId: session.tenantId!,
    role: session.role!,
    contractId,
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/app/contratti");
  if (vendorId) revalidatePath(`/app/vendors/${vendorId}`);
  return {};
}
