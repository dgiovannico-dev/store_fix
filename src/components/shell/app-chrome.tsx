import Link from "next/link";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { t } from "@/i18n";
import { navLinksForRole } from "./nav-links";

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return <>{children}</>;

  const prefs = session.tenantId
    ? await getTenantI18nPrefs(session.tenantId)
    : { locale: "it" as const, currency: "EUR", dateLocale: "it-IT" };
  const msg = t(prefs.locale);
  const { home, links } = navLinksForRole(session.role, prefs.locale);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={home}
              className="font-[family-name:var(--font-sora)] font-semibold text-[var(--primary)]"
            >
              {msg.appName}
            </Link>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[var(--muted-foreground)] hover:underline"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <NotificationBell
            role={session.role}
            labels={msg.notifBell}
            dateLocale={prefs.dateLocale}
            currency={prefs.currency}
            locale={prefs.locale}
          />
        </div>
      </header>
      {children}
    </div>
  );
}
