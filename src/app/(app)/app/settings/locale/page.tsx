import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { updateTenantI18nAction } from "@/app/actions/tenant-i18n";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { tenantMessages } from "@/i18n/tenant-messages";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/lib/ui-classes";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"] as const;

export default async function LocaleSettingsPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canMutate(session.role, RbacAction.manageTenant)) {
    redirect("/app/tickets");
  }

  const prefs = await getTenantI18nPrefs(session.tenantId);
  const msg = await tenantMessages(session.tenantId);
  const currencyDefault = CURRENCIES.includes(
    prefs.currency as (typeof CURRENCIES)[number],
  )
    ? prefs.currency
    : "EUR";

  return (
    <PageFrame narrow>
      <div data-tour="page.settings.locale">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {msg.localeSettings.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {msg.localeSettings.hint}
      </p>
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        <Link
          href="/app/settings/members"
          className="text-[var(--primary)] underline-offset-4 hover:underline"
        >
          {msg.members.title}
        </Link>
        <Link
          href="/app/settings/audit"
          className="text-[var(--primary)] underline-offset-4 hover:underline"
        >
          {msg.audit.title}
        </Link>
      </p>

      <form
        action={async (fd) => {
          "use server";
          await updateTenantI18nAction({}, fd);
        }}
        className="mt-8 space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6"
      >
        <label className="block text-sm font-medium">
          {msg.localeSettings.language}
          <select
            name="defaultLocale"
            defaultValue={prefs.locale}
            className={`mt-1.5 ${controlClass}`}
          >
            <option value="it">{msg.localeSettings.langIt}</option>
            <option value="en">{msg.localeSettings.langEn}</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          {msg.localeSettings.currency}
          <select
            name="currency"
            defaultValue={currencyDefault}
            className={`mt-1.5 ${controlClass}`}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-[var(--muted-foreground)]">
          {msg.localeSettings.formatHint}
        </p>
        <Button type="submit">{msg.localeSettings.save}</Button>
      </form>
    
      </div>
    </PageFrame>
  );
}
