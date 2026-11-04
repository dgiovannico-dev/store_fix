import Link from "next/link";
import { AuthMistWash } from "@/components/auth/auth-mist-wash";
import { requestMessages } from "@/i18n/request-locale";

export default async function HomePage() {
  const home = (await requestMessages()).home;

  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-16">
      <AuthMistWash />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-sm font-medium tracking-wide text-[var(--muted-foreground)]">
            {home.eyebrow}
          </p>
          <h1
            className="text-4xl font-semibold tracking-tight text-[var(--primary)]"
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
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium"
          >
            {home.health}
          </Link>
        </div>
      </div>
    </main>
  );
}
