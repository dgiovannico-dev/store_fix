"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { updateTenantI18nPrefs } from "@/application/tenant/i18n-prefs";

export async function updateTenantI18nAction(
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.tenantId || !session.role) {
    return { error: "Accesso richiesto" };
  }
  const result = await updateTenantI18nPrefs({
    tenantId: session.tenantId,
    role: session.role,
    data: {
      defaultLocale: formData.get("defaultLocale"),
      currency: String(formData.get("currency") ?? "EUR")
        .trim()
        .toUpperCase(),
      dateLocale: formData.get("dateLocale") || undefined,
    },
  });
  if (!result.ok) return { error: result.message };
  revalidatePath("/app");
  revalidatePath("/app/settings/locale");
  return { ok: true };
}
