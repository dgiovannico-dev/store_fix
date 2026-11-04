import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { listChargebackByStore } from "@/application/finance/chargeback-query";
import { PageFrame } from "@/components/layout/page-frame";
import { getActiveMembership } from "@/application/memberships/membership-service";

const HQ = new Set<Role>([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
  Role.viewer_finance,
]);

/** F6-02 — riparto costi per PV. */
export default async function ChargebackPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) redirect("/login");
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership || !HQ.has(membership.role)) redirect("/app/dashboard");

  const sp = await searchParams;
  const days = Math.min(Math.max(Number(sp.days ?? 30) || 30, 7), 365);
  const rows = await listChargebackByStore(session.tenantId, days);

  const csv = [
    "store,tickets,estimated_eur,actual_eur",
    ...rows.map(
      (r) =>
        `"${r.name.replace(/"/g, '""')}",${r.tickets},${r.estimated.toFixed(2)},${r.actual.toFixed(2)}`,
    ),
  ].join("\n");

  return (
    <PageFrame>
      <div className="space-y-6" data-tour="page.chargeback.root">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
              Chargeback costi per PV
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Ultimi {days} giorni — stimati vs effettivi (ticket done/verificati).
            </p>
          </div>
          <a
            className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--muted)]"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download={`chargeback-${days}d.csv`}
          >
            Esporta CSV
          </a>
        </div>
        <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--muted)]/40 text-[var(--muted-foreground)]">
              <tr>
                <th className="px-3 py-2 font-medium">Punto vendita</th>
                <th className="px-3 py-2 font-medium">Ticket</th>
                <th className="px-3 py-2 font-medium">Stimato €</th>
                <th className="px-3 py-2 font-medium">Effettivo €</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.storeId} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 tabular">{r.tickets}</td>
                  <td className="px-3 py-2 tabular">
                    {r.estimated.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 tabular">{r.actual.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  );
}
