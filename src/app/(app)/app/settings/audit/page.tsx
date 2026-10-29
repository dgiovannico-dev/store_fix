import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listMembershipConfigAudit } from "@/domain/memberships/membership-service";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { StatusPanel } from "@/components/ui/status-panel";

export default async function ConfigAuditPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!can(session.role, RbacAction.viewConfigAudit)) {
    redirect("/app/dashboard");
  }

  const events = await listMembershipConfigAudit({
    tenantId: session.tenantId,
    role: session.role,
    take: 50,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            Audit config
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Eventi append-only su membership / ruoli (solo owner / admin_hq)
          </p>
        </div>
        <Link
          href="/app/settings/members"
          className="text-sm text-[var(--primary)] underline-offset-4 hover:underline"
        >
          Membri
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="mt-8">
          <StatusPanel
            kind="empty"
            title="Nessun evento"
            body="Le modifiche a ruoli e membership appariranno qui."
          />
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-[var(--border)] text-sm">
          {events.map((e) => (
            <li key={e.id} className="py-3">
              <p className="font-medium">{e.type}</p>
              <p className="text-[var(--muted-foreground)]">
                {e.createdAt.toLocaleString("it-IT")}
                {e.membershipId ? ` · membership ${e.membershipId.slice(0, 8)}…` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
