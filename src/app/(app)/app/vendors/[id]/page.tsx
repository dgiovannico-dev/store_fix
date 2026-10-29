import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { updateVendorAction } from "@/app/actions/vendors";
import { getVendorScorecard } from "@/application/dashboard/vendor-scorecard";
import { RbacAction } from "@/domain/rbac/actions";
import { can, canMutate } from "@/domain/rbac/can";
import { listStores } from "@/domain/stores/store-service";
import {
  canReadVendorContracts,
  listVendorContracts,
} from "@/domain/vendor-contracts/vendor-contract-service";
import { getVendor } from "@/domain/vendors/vendor-service";
import { formatEur } from "@/domain/ticket/costs";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { formatMoney } from "@/i18n/format";
import { tenantMessages } from "@/i18n/tenant-messages";

type Props = { params: Promise<{ id: string }> };

export default async function VendorDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");

  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const eur = (n: number) => formatMoney(n, prefs) ?? "—";
  const { id } = await params;
  const [vendor, stores] = await Promise.all([
    getVendor(session.tenantId, id),
    listStores(session.tenantId),
  ]);
  if (!vendor) notFound();

  const canEdit = canMutate(session.role, RbacAction.crudVendor);
  const canScorecard = can(session.role, RbacAction.dashboardHq);
  const showCosts = can(session.role, RbacAction.viewCosts);
  const coverage = new Set(vendor.storeCoverageIds);

  const score =
    canScorecard
      ? await getVendorScorecard({
          tenantId: session.tenantId,
          role: session.role,
          vendorId: id,
          rangeDays: 30,
        })
      : null;

  const contracts = canReadVendorContracts(session.role)
    ? await listVendorContracts({
        tenantId: session.tenantId,
        role: session.role,
        vendorId: id,
        expiringWithinDays: null,
      })
    : [];

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link
        href="/app/vendors"
        className="text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline"
      >
        ← Fornitori
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-sora)] text-2xl font-semibold">
        {vendor.name}
      </h1>

      {score ? (
        <section className="mt-6 rounded-[var(--radius)] border border-[var(--border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">{msg.scorecard.sectionTitle}</h2>
            <Link
              href="/app/vendors/scorecard"
              className="text-xs text-[var(--muted-foreground)] underline-offset-4 hover:underline"
            >
              {msg.scorecard.linkList}
            </Link>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[var(--muted-foreground)]">
                {msg.scorecard.colClosed}
              </dt>
              <dd className="tabular-nums font-medium">{score.closedCount}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">
                {msg.scorecard.colDays}
              </dt>
              <dd className="tabular-nums font-medium">
                {score.avgResolutionDays == null
                  ? "—"
                  : score.avgResolutionDays.toLocaleString("it-IT", {
                      maximumFractionDigits: 1,
                    })}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">
                {msg.scorecard.colSla}
              </dt>
              <dd className="tabular-nums font-medium">
                {score.slaHitRate == null
                  ? "—"
                  : `${Math.round(score.slaHitRate * 100)}%`}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">
                {msg.scorecard.colOpen}
              </dt>
              <dd className="tabular-nums font-medium">
                {score.openAssignedCount}
              </dd>
            </div>
            {showCosts ? (
              <div>
                <dt className="text-[var(--muted-foreground)]">
                  {msg.scorecard.colCosts}
                </dt>
                <dd className="tabular-nums font-medium">
                  {eur(score.costsTotal)}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {canEdit ? (
        <form
          className="mt-8 space-y-3"
          action={async (fd) => {
            "use server";
            await updateVendorAction(id, fd);
          }}
        >
          <input
            name="name"
            defaultValue={vendor.name}
            required
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
          <input
            name="email"
            type="email"
            defaultValue={vendor.email ?? ""}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
          <input
            name="phone"
            defaultValue={vendor.phone ?? ""}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
          <input
            name="trades"
            defaultValue={vendor.trades.join(", ")}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
          />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Coverage</legend>
            {stores.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="storeCoverageIds"
                  value={s.id}
                  defaultChecked={coverage.has(s.id)}
                />
                {s.name}
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            Salva
          </button>
        </form>
      ) : (
        <dl className="mt-6 space-y-2 text-sm">
          <div>
            <dt className="text-[var(--muted-foreground)]">Email</dt>
            <dd>{vendor.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted-foreground)]">Telefono</dt>
            <dd>{vendor.phone ?? "—"}</dd>
          </div>
        </dl>
      )}

      {canReadVendorContracts(session.role) ? (
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">{msg.contracts.sectionVendor}</h2>
            <Link
              href="/app/contratti"
              className="text-xs text-[var(--muted-foreground)] underline-offset-4 hover:underline"
            >
              {msg.nav.contracts}
            </Link>
          </div>
          {contracts.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {msg.contracts.empty}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
              {contracts.map((c) => (
                <li key={c.id} className="py-2">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-[var(--muted-foreground)]">
                    {c.endsOn.toLocaleDateString("it-IT")}
                    {c.annualFee != null
                      ? ` · ${formatEur(c.annualFee)}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}
