import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActiveMembership } from "@/domain/memberships/membership-service";
import { listStores } from "@/domain/stores/store-service";

/**
 * Hub deep link: istruzioni IT + link per store in scope.
 */
export default async function SegnalaHubPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId || !session.role) {
    redirect("/login");
  }
  const membership = await getActiveMembership(
    session.user.id,
    session.tenantId,
  );
  if (!membership) redirect("/login");

  const stores = await listStores(session.tenantId, membership);
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return (
    <main className="mx-auto max-w-[390px] px-4 py-10">
      <h1 className="font-[family-name:var(--font-sora)] text-xl font-semibold text-[var(--primary)]">
        Segnala guasto
      </h1>
      <p className="mt-3 text-sm text-[var(--muted-foreground)]">
        Invia questo link sul gruppo WhatsApp del punto vendita. Su Chrome /
        Android: menu → «Installa app» (o «Aggiungi a Home»); su iOS Safari →
        Condividi → «Aggiungi a Home». Serve l&apos;accesso FacilityFlow
        (nessuna API WhatsApp Business). Offline: vedi solo la pagina di
        avviso — i ticket richiedono rete.
      </p>

      {stores.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted-foreground)]">
          Nessun punto vendita nello scope.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {stores.map((s) => {
            const path = `/app/segnala/${s.id}`;
            return (
              <li key={s.id} className="space-y-1">
                <p className="font-medium">{s.name}</p>
                <Link
                  href={path}
                  className="block text-sm text-[var(--primary)] underline-offset-4 hover:underline"
                >
                  Apri segnalazione
                </Link>
                <code className="block break-all text-xs text-[var(--muted-foreground)]">
                  {base}
                  {path}
                </code>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/app/tickets"
        className="mt-10 inline-block text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline"
      >
        ← Ticket
      </Link>
    </main>
  );
}
