import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { listStores } from "@/domain/stores/store-service";
import { tenantMessages } from "@/i18n/tenant-messages";

/**
 * Hub deep link: istruzioni + link per store in scope.
 */
export default async function SegnalaHubPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) redirect("/login");

  const [msg, stores] = await Promise.all([
    tenantMessages(session.tenantId),
    listStores(session.tenantId, membership),
  ]);
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return (
    <main className="mx-auto max-w-[390px] px-4 py-10">
      <h1 className="font-[family-name:var(--font-sora)] text-xl font-semibold text-[var(--primary)]">
        {msg.intake.title}
      </h1>
      <p className="mt-3 text-sm text-[var(--muted-foreground)]">
        {msg.intake.hubHint}
      </p>

      {stores.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted-foreground)]">
          {msg.intake.noStores}
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {stores.map((s) => {
            const path = `/app/segnala/${s.id}`;
            return (
              <li key={s.id} className="space-y-1">
                <p className="font-medium">{s.name}</p>
                <Link
                  href={path}
                  className="block text-sm text-[var(--primary)] underline-offset-4 hover:underline"
                >
                  {msg.intake.openReport}
                </Link>
                <code className="block break-all text-xs text-[var(--muted-foreground)]">
                  {base}
                  {path}
                </code>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/app/tickets"
        className="mt-10 inline-block text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline"
      >
        {msg.intake.backTickets}
      </Link>
    </main>
  );
}
