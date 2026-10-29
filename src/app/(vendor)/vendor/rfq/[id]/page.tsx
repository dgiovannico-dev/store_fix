import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { submitQuoteBidAction } from "@/app/actions/rfq";
import { getQuoteRequest } from "@/application/rfq/rfq-service";
import { formatMoney } from "@/i18n/format";
import { prisma } from "@/infrastructure/db/prisma";

export default async function VendorRfqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.tenantId || !session.user?.id || session.role !== Role.vendor) {
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      tenantId: session.tenantId,
      userId: session.user.id,
      deletedAt: null,
    },
  });
  if (!membership?.vendorId) redirect("/vendor/inbox");

  const { id } = await params;
  let request;
  try {
    request = await getQuoteRequest({
      tenantId: session.tenantId,
      role: session.role,
      requestId: id,
      membership,
    });
  } catch {
    redirect("/vendor/rfq");
  }
  if (!request) notFound();

  const bid = request.bids[0];
  if (!bid) notFound();

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <p className="text-sm">
        <Link
          href="/vendor/rfq"
          className="text-[var(--primary)] hover:underline"
        >
          ← RFQ
        </Link>
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {request.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Stato RFQ: {request.status}
      </p>
      {request.notes ? (
        <p className="mt-4 whitespace-pre-wrap text-sm">{request.notes}</p>
      ) : null}

      {bid.amountEur != null ? (
        <p className="mt-6 text-sm">
          Offerta inviata: <strong>{formatMoney(bid.amountEur)}</strong>
          {bid.note ? ` — ${bid.note}` : ""}
        </p>
      ) : null}

      {request.status === "open" && bid.status !== "withdrawn" ? (
        <form
          action={async (fd) => {
            "use server";
            await submitQuoteBidAction(bid.id, fd);
          }}
          className="mt-6 space-y-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
        >
          <label className="block text-sm">
            Importo EUR
            <input
              name="amountEur"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={
                bid.amountEur != null ? String(bid.amountEur) : undefined
              }
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Nota
            <input
              name="note"
              maxLength={500}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {bid.status === "submitted" ? "Aggiorna offerta" : "Invia offerta"}
          </button>
        </form>
      ) : null}
    </main>
  );
}
