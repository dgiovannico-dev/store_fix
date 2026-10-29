"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createPmEvent,
  markPmEventDone,
  softDeletePmEvent,
} from "@/domain/pm/pm-event-service";

async function sessionTenant() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) return null;
  return session;
}

export async function createPmEventAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await sessionTenant();
  if (!session) return { error: "Accesso richiesto" };
  const date = String(formData.get("scheduledDate") ?? "");
  const time = String(formData.get("scheduledTime") ?? "09:00");
  const scheduledAt = new Date(`${date}T${time}:00`);
  const result = await createPmEvent({
    tenantId: session.tenantId!,
    role: session.role!,
    data: {
      storeId: formData.get("storeId"),
      title: formData.get("title"),
      scheduledAt,
      vendorId: formData.get("vendorId") || null,
      notes: formData.get("notes") || null,
    },
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/app/calendario");
  return {};
}

export async function completePmEventAction(
  eventId: string,
): Promise<{ error?: string }> {
  const session = await sessionTenant();
  if (!session) return { error: "Accesso richiesto" };
  const result = await markPmEventDone({
    tenantId: session.tenantId!,
    role: session.role!,
    eventId,
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/app/calendario");
  return {};
}

export async function cancelPmEventAction(
  eventId: string,
): Promise<{ error?: string }> {
  const session = await sessionTenant();
  if (!session) return { error: "Accesso richiesto" };
  const result = await softDeletePmEvent({
    tenantId: session.tenantId!,
    role: session.role!,
    eventId,
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/app/calendario");
  return {};
}
