import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listContractPerformance } from "@/application/contracts/performance-query";
import { PageFrame } from "@/components/layout/page-frame";
import { can } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";

/** F6-05 — contratto vs misurato (PM due vs done) — HQ / contract readers. */
export default async function ContractPerformancePage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!can(session.role, RbacAction.crudVendorContract)) {
    redirect("/app/tickets");
  }

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const rows = await listContractPerformance(session.tenantId, since);

  return (
    <PageFrame>
      <div className="space-y-4" data-tour="hq.contracts.performance">
        <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
          Contratto vs misurato
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          PM programmati vs completati (ultimi 90 giorni).
        </p>
        <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--muted)]/40 text-[var(--muted-foreground)]">
              <tr>
                <th className="px-3 py-2">Vendor</th>
                <th className="px-3 py-2">Store</th>
                <th className="px-3 py-2">PM due</th>
                <th className="px-3 py-2">PM done</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2 font-medium">{r.vendorName}</td>
                  <td className="px-3 py-2">{r.storeName ?? "—"}</td>
                  <td className="px-3 py-2 tabular">{r.due}</td>
                  <td className="px-3 py-2 tabular">{r.done}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageFrame>
  );
}
