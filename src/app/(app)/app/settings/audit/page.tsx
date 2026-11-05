import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { listMembershipConfigAudit } from "@/application/memberships/membership-service";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { PageFrame } from "@/components/layout/page-frame";
import { StatusPanel } from "@/components/ui/status-panel";
import { dateLocaleFor } from "@/i18n";
import { tableHeadClass, tableRowClass } from "@/lib/ui-classes";
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

  function auditEventLabel(type: string): string {
    switch (type) {
      case "membership.updated":
        return copy.evtMembershipUpdated;
      case "membership.role_changed":
        return copy.evtMembershipRoleChanged;
      case "membership.soft_disabled":
        return copy.evtMembershipSoftDisabled;
      default:
        return `${copy.evtUnknown}: ${type}`;
    }
  }

  return (
    <PageFrame>
      <div data-tour="page.settings.audit">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {copy.hint}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href="/api/audit/export?format=json"
            className="text-[var(--primary)] underline-offset-4 hover:underline"
          >
            {copy.exportJson}
          </a>
          <a
            href="/api/audit/export?format=csv"
            className="text-[var(--primary)] underline-offset-4 hover:underline"
          >
            {copy.exportCsv}
          </a>
          <Link
            href="/app/settings/members"
            className="text-[var(--primary)] underline-offset-4 hover:underline"
          >
            {copy.membersLink}
          </Link>
        </div>
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
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={tableHeadClass}>
                <th className="py-2 pr-3 font-medium">{copy.colEvent}</th>
                <th className="py-2 font-medium">{copy.colWhen}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className={tableRowClass}>
                  <td className="py-2.5 pr-3 font-medium">
                    {auditEventLabel(e.type)}
                    {e.membershipId ? (
                      <span className="ml-2 font-normal text-[var(--muted-foreground)]">
                        · {e.membershipId.slice(0, 8)}…
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5 tabular-nums text-[var(--muted-foreground)]">
                    {e.createdAt.toLocaleString(dLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </PageFrame>
  );
}
