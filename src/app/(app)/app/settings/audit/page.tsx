import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { listMembershipConfigAudit } from "@/domain/memberships/membership-service";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { StatusPanel } from "@/components/ui/status-panel";
import { dateLocaleFor } from "@/i18n";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function ConfigAuditPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!can(session.role, RbacAction.viewConfigAudit)) {
    redirect("/app/dashboard");
  }

  const [msg, prefs, events] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
    listMembershipConfigAudit({
      tenantId: session.tenantId,
      role: session.role,
      take: 50,
    }),
  ]);
  const copy = msg.audit;
  const dLocale = dateLocaleFor(prefs.locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {copy.hint}
          </p>
        </div>
        <Link
          href="/app/settings/members"
          className="text-sm text-[var(--primary)] underline-offset-4 hover:underline"
        >
          {copy.membersLink}
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            locale={prefs.locale}
            title={copy.emptyTitle}
            body={copy.emptyBody}
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-[var(--border)] text-sm">
          {events.map((e) => (
            <li key={e.id} className="py-3">
              <p className="font-medium">{e.type}</p>
              <p className="text-[var(--muted-foreground)]">
                {e.createdAt.toLocaleString(dLocale)}
                {e.membershipId
                  ? ` · membership ${e.membershipId.slice(0, 8)}…`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
