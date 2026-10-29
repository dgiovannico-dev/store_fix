import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createVendorContractAction,
  deleteVendorContractAction,
} from "@/app/actions/vendor-contracts";
import { RbacAction } from "@/domain/rbac/actions";
import { canMutate } from "@/domain/rbac/can";
import { listStores } from "@/domain/stores/store-service";
import {
  canReadVendorContracts,
  listVendorContracts,
} from "@/domain/vendor-contracts/vendor-contract-service";
import { listVendors } from "@/domain/vendors/vendor-service";
import { formatEur } from "@/domain/ticket/costs";
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { tenantMessages } from "@/i18n/tenant-messages";

function expiryTone(endsOn: Date, now: Date) {
  if (endsOn.getTime() < now.getTime()) return "text-[var(--critical)]";
  const days =
    (endsOn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 60) return "text-amber-700";
  return "text-[var(--muted-foreground)]";
}

type Props = { searchParams: Promise<{ all?: string }> };

export default async function ContrattiPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canReadVendorContracts(session.role)) redirect("/app/tickets");

  const [msg, prefs] = await Promise.all([
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
  ]);
  const dayLabel = (d: Date) => d.toLocaleDateString(prefs.dateLocale);
  const sp = await searchParams;
  const showAll = sp.all === "1";
  const canEdit = canMutate(session.role, RbacAction.crudVendorContract);

  const [contracts, vendors, stores] = await Promise.all([
    listVendorContracts({
      tenantId: session.tenantId,
      role: session.role,
      expiringWithinDays: showAll ? null : 60,
    }),
    listVendors(session.tenantId),
    listStores(session.tenantId),
  ]);
  const now = new Date();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {msg.contracts.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {showAll ? msg.contracts.hintAll : msg.contracts.hintExpiring}
          </p>
        </div>
        <Link
          href={showAll ? "/app/contratti" : "/app/contratti?all=1"}
          className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
        >
          {showAll ? msg.contracts.filterExpiring : msg.contracts.filterAll}
        </Link>
      </div>

      {canEdit && vendors.length > 0 ? (
        <form
          action={async (fd) => {
            "use server";
            await createVendorContractAction({}, fd);
          }}
          className="mt-8 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
        >
          <p className="text-sm font-medium">{msg.contracts.add}</p>
          <select
            name="vendorId"
            required
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Fornitore
            </option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <select
            name="storeId"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="">Tutta la rete</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            name="title"
            required
            minLength={2}
            placeholder="Titolo (es. Manutenzione HVAC)"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
          />
          <input
            name="reference"
            placeholder="Riferimento"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Inizio
              <input
                name="startsOn"
                type="date"
                required
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Scadenza
              <input
                name="endsOn"
                type="date"
                required
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
              />
            </label>
          </div>
          <input
            name="annualFee"
            type="number"
            step="0.01"
            min="0"
            placeholder="Canone annuo EUR (opz.)"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            Salva contratto
          </button>
        </form>
      ) : null}

      <ul className="mt-10 divide-y divide-[var(--border)]">
        {contracts.length === 0 ? (
          <li className="py-6 text-sm text-[var(--muted-foreground)]">
            {msg.contracts.empty}
          </li>
        ) : (
          contracts.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-start justify-between gap-3 py-4"
            >
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  <Link
                    href={`/app/vendors/${c.vendorId}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {c.vendor.name}
                  </Link>
                  {c.store ? ` · ${c.store.name}` : " · rete"}
                  {c.reference ? ` · ${c.reference}` : ""}
                </p>
                <p className={`mt-1 text-sm ${expiryTone(c.endsOn, now)}`}>
                  {dayLabel(c.startsOn)} → {dayLabel(c.endsOn)}
                  {c.annualFee != null
                    ? ` · ${formatEur(c.annualFee)}`
                    : ""}
                </p>
              </div>
              {canEdit ? (
                <form
                  action={async () => {
                    "use server";
                    await deleteVendorContractAction(c.id, c.vendorId);
                  }}
                >
                  <button
                    type="submit"
                    className="text-sm text-[var(--critical)] underline-offset-4 hover:underline"
                  >
                    {msg.contracts.archive}
                  </button>
                </form>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
