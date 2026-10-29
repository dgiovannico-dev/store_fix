import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { tenantMessages } from "@/i18n/tenant-messages";
import { StoreImportForm } from "./store-import-form";

export default async function StoreImportPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  return <StoreImportForm msg={msg} locale={prefs.locale} />;
}
