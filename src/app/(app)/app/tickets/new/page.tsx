import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loadTicketFormOptions } from "@/application/tickets/form-options";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { tenantMessages } from "@/i18n/tenant-messages";
import { NewTicketForm } from "./new-ticket-form";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  const sp = await searchParams;
  const [msg, prefs, options] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
    loadTicketFormOptions({
      userId: session.user.id,
      tenantId: session.tenantId,
      role: session.role,
    }),
  ]);

  const formOptions =
    "error" in options
      ? { stores: [], assets: [], loadError: true as const }
      : { ...options, loadError: false as const };

  const preferredStoreId =
    sp.storeId && formOptions.stores.some((s) => s.id === sp.storeId)
      ? sp.storeId
      : formOptions.stores[0]?.id ?? "";

  return (
    <NewTicketForm
      msg={msg}
      locale={prefs.locale}
      stores={formOptions.stores}
      assets={formOptions.assets}
      initialStoreId={preferredStoreId}
      loadError={formOptions.loadError}
    />
  );
}
