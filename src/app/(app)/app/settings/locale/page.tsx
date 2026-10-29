import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { updateTenantI18nAction } from "@/app/actions/tenant-i18n";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { t } from "@/i18n";

export default async function LocaleSettingsPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canMutate(session.role, RbacAction.manageTenant)) {
    redirect("/app/tickets");
  }

  const prefs = await getTenantI18nPrefs(session.tenantId);
  const msg = t(prefs.locale);

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        Lingua e regione
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Preferenze tenant (catalogo UI {prefs.locale.toUpperCase()}, valuta{" "}
        {prefs.currency}). Workspace: {msg.appName}.
      </p>

      <form
        action={async (fd) => {
          "use server";
          await updateTenantI18nAction({}, fd);
        }}
        className="mt-8 space-y-4 rounded-[var(--radius)] border border-[var(--border)] p-4"
      >
        <label className="block text-sm">
          Lingua UI
          <select
            name="defaultLocale"
            defaultValue={prefs.locale}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          >
            <option value="it">Italiano</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="block text-sm">
          Valuta (ISO 4217)
          <input
            name="currency"
            defaultValue={prefs.currency}
            maxLength={3}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 uppercase"
          />
        </label>
        <label className="block text-sm">
          Locale date (BCP 47)
          <input
            name="dateLocale"
            defaultValue={prefs.dateLocale}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          Salva
        </button>
      </form>
    </main>
  );
}
