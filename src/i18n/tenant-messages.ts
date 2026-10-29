import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { t, type MessageCatalog } from "@/i18n";

/** Catalogo UI per tenant (F3-06) — evita `t("it")` hardcoded. */
export async function tenantMessages(
  tenantId: string,
): Promise<MessageCatalog> {
  const prefs = await getTenantI18nPrefs(tenantId);
  return t(prefs.locale);
}
