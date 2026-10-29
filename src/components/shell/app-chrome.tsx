import Link from "next/link";
import { auth } from "@/auth";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { t } from "@/i18n";
import { navLinksForRole } from "./nav-links";

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return <>{children}</>;

  const msg = t("it");
  const { home, links } = navLinksForRole(session.role);

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
          <NotificationBell role={session.role} />
        </div>
      </header>
      {children}
    </div>
  );
}
