import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-[var(--muted-foreground)]">
          Manutenzione retail · Italia
        </p>
        <h1
          className="text-4xl font-semibold tracking-tight text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          FacilityFlow
        </h1>
        <p className="max-w-xl text-lg text-[var(--muted-foreground)]">
          System of record per ticket, SLA e fornitori — senza perderti in
          WhatsApp. Scaffold S1 in corso (OSS self-host).
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          Accedi
        </Link>
        <Link
          href="/api/health"
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Health check
        </Link>
      </div>
    </main>
  );
}
