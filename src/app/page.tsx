import Link from "next/link";
import { requestMessages } from "@/i18n/request-locale";

export default async function HomePage() {
  const home = (await requestMessages()).home;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-[var(--muted-foreground)]">
          {home.eyebrow}
        </p>
        <h1
          className="text-4xl font-semibold tracking-tight text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          FacilityFlow
        </h1>
        <p className="max-w-xl text-lg text-[var(--muted-foreground)]">
          {home.body}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          {home.signIn}
        </Link>
        <Link
          href="/api/health"
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          {home.health}
        </Link>
      </div>
    </main>
  );
}
