import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { awardQuoteBidAction } from "@/app/actions/rfq";
import { getQuoteRequest } from "@/application/rfq/rfq-service";
import { canMutate } from "@/domain/rbac/can";
import { RbacAction } from "@/domain/rbac/actions";
import { formatMoney } from "@/i18n/format";

export default async function RfqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.tenantId || !session.role) redirect("/login");
  if (!canMutate(session.role, RbacAction.manageRfq)) redirect("/app/tickets");

  const { id } = await params;
  const request = await getQuoteRequest({
    tenantId: session.tenantId,
    role: session.role,
    requestId: id,
  });
  if (!request) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm">
        <Link href="/app/rfq" className="text-[var(--primary)] hover:underline">
          ← RFQ
        </Link>
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {request.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Stato: {request.status}
        {request.store ? ` · ${request.store.name}` : ""}
        {request.ticketId ? (
          <>
            {" · "}
            <Link
              href={`/app/tickets/${request.ticketId}`}
              className="underline"
            >
              ticket
            </Link>
          </>
        ) : null}
      </p>
      {request.notes ? (
        <p className="mt-4 whitespace-pre-wrap text-sm">{request.notes}</p>
      ) : null}

      <h2 className="mt-8 text-sm font-semibold">Offerte</h2>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {request.bids.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{b.vendor.name}</p>
              <p className="text-[var(--muted-foreground)]">
                {b.status}
                {b.amountEur != null
                  ? ` · ${formatMoney(b.amountEur)}`
                  : ""}
                {b.note ? ` — ${b.note}` : ""}
              </p>
            </div>
            {request.status === "open" && b.status === "submitted" ? (
              <form
                action={async () => {
                  "use server";
                  await awardQuoteBidAction(request.id, b.id);
                }}
              >
                <button
                  type="submit"
                  className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--muted)]"
                >
                  Aggiudica
                </button>
              </form>
            ) : null}
            {request.awardedBidId === b.id ? (
              <span className="text-xs font-medium text-emerald-700">
                Aggiudicata
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
