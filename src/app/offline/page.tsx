import Link from "next/link";

/** Fallback navigazione offline (F2-06) — nessuna scrittura SoR. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        Sei offline
      </h1>
      <p className="mt-3 text-sm text-[var(--muted-foreground)]">
        FacilityFlow richiede connessione per ticket, SLA e costi. Gli asset
        dell&apos;interfaccia possono restare in cache; i dati restano sul
        server.
      </p>
      <p className="mt-6 text-sm">
        Ripristina la rete e{" "}
        <Link
          href="/app"
          className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
        >
          riprova
        </Link>
        .
      </p>
    </main>
  );
}
