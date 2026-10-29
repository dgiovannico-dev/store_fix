import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listQuoteRequests } from "@/application/rfq/rfq-service";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { formatMoney } from "@/i18n/format";

export default async function RfqListPage() {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canMutate(session.role, RbacAction.manageRfq)) redirect("/app/tickets");

  const items = await listQuoteRequests({
    tenantId: session.tenantId,
    role: session.role,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
          Richieste preventivo (RFQ)
        </h1>
        <Link
          href="/app/rfq/new"
          className="rounded-[var(--radius)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          Nuova RFQ
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Confronta offerte da più fornitori del tenant (no marketplace).
      </p>

      <ul className="mt-8 divide-y divide-[var(--border)]">
        {items.length === 0 ? (
          <li className="py-6 text-sm text-[var(--muted-foreground)]">
            Nessuna RFQ. Crea una richiesta e invita i fornitori.
          </li>
        ) : (
          items.map((r) => {
            const submitted = r.bids.filter((b) => b.status === "submitted");
            const amounts = submitted
              .map((b) => Number(b.amountEur))
              .filter((n) => Number.isFinite(n));
            const min =
              amounts.length > 0
                ? formatMoney(Math.min(...amounts))
                : null;
            return (
              <li key={r.id} className="py-4">
                <Link
                  href={`/app/rfq/${r.id}`}
                  className="font-medium text-[var(--primary)] hover:underline"
                >
                  {r.title}
                </Link>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {r.status} · {r.bids.length} invitati · {submitted.length}{" "}
                  risposte
                  {min ? ` · da ${min}` : ""}
                  {r.ticketId ? ` · ticket ${r.ticketId.slice(0, 8)}…` : ""}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </main>
  );
}
