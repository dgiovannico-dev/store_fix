import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { listVendorQuoteBids } from "@/application/rfq/rfq-service";
import { formatMoney } from "@/i18n/format";
import { prisma } from "@/infrastructure/db/prisma";

export default async function VendorRfqListPage() {
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

  const bids = await listVendorQuoteBids({
    tenantId: session.tenantId,
    role: session.role,
    membership,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        Richieste preventivo
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Solo le RFQ a cui sei stato invitato.
      </p>
      <ul className="mt-8 divide-y divide-[var(--border)]">
        {bids.length === 0 ? (
          <li className="py-6 text-sm text-[var(--muted-foreground)]">
            Nessun invito RFQ.
          </li>
        ) : (
          bids.map((b) => (
            <li key={b.id} className="py-4">
              <Link
                href={`/vendor/rfq/${b.quoteRequest.id}`}
                className="font-medium text-[var(--primary)] hover:underline"
              >
                {b.quoteRequest.title}
              </Link>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                RFQ {b.quoteRequest.status} · tua offerta: {b.status}
                {b.amountEur != null ? ` · ${formatMoney(b.amountEur)}` : ""}
              </p>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
