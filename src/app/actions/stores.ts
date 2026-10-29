"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createStore,
  softDeleteStore,
  updateStore,
} from "@/domain/stores/store-service";

async function sessionTenant() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    return null;
  }
  return session;
}

export async function createStoreAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await sessionTenant();
  if (!session) return { error: "Accesso richiesto" };

  const result = await createStore({
    tenantId: session.tenantId!,
    role: session.role!,
    data: {
      name: formData.get("name"),
      address: formData.get("address") || null,
      city: formData.get("city") || null,
      zip: formData.get("zip") || null,
      timezone: formData.get("timezone") || "Europe/Rome",
      contacts: formData.get("contacts") || null,
      webhookUrl: formData.get("webhookUrl") || null,
      ntfyTopic: formData.get("ntfyTopic") || null,
    },
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/app/stores");
  return {};
}

export async function updateStoreAction(
  storeId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await sessionTenant();
  if (!session) return { error: "Accesso richiesto" };
  const result = await updateStore({
    tenantId: session.tenantId!,
    role: session.role!,
    storeId,
    data: {
      name: formData.get("name"),
      address: formData.get("address") || null,
      city: formData.get("city") || null,
      zip: formData.get("zip") || null,
      timezone: formData.get("timezone") || "Europe/Rome",
      contacts: formData.get("contacts") || null,
      webhookUrl: formData.get("webhookUrl") || null,
      ntfyTopic: formData.get("ntfyTopic") || null,
    },
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/app/stores");
  revalidatePath(`/app/stores/${storeId}`);
  return {};
}

export async function deleteStoreAction(storeId: string): Promise<void> {
  const session = await sessionTenant();
  if (!session) return;
  await softDeleteStore({
    tenantId: session.tenantId!,
    role: session.role!,
    storeId,
  });
  revalidatePath("/app/stores");
}
