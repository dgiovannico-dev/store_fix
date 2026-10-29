import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { tenantMessages } from "@/i18n/tenant-messages";
import { NewTicketForm } from "./new-ticket-form";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  return <NewTicketForm msg={msg} locale={prefs.locale} />;
}
