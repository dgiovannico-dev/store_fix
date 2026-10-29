import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginAction } from "@/app/actions/login";

type Props = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const error =
    params.error === "CredentialsSignin"
      ? "Email o password non corretti."
      : params.error === "RateLimit"
        ? "Troppi tentativi di accesso. Riprova tra qualche minuto."
        : params.error
          ? "Accesso non riuscito. Riprova."
          : null;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.92_0.03_75/0.55),transparent_50%),radial-gradient(ellipse_at_80%_80%,oklch(0.93_0.02_250/0.7),transparent_45%),linear-gradient(165deg,oklch(0.97_0.01_95),oklch(0.94_0.015_250))]"
      />

      <div className="relative z-10 w-full max-w-md">
        <p className="font-[family-name:var(--font-sora)] text-4xl font-semibold tracking-tight text-[var(--primary)] sm:text-5xl">
          FacilityFlow
        </p>
        <p className="mt-3 max-w-sm text-[var(--muted-foreground)]">
          Manutenzione retail, un solo sistema di verità per store, HQ e
          fornitori.
        </p>

        <form className="mt-10 space-y-5" action={loginAction}>
          <input
            type="hidden"
            name="callbackUrl"
            value={params.callbackUrl ?? "/onboarding"}
          />

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-base outline-none ring-[var(--ring)] focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-base outline-none ring-[var(--ring)] focus:ring-2"
            />
          </div>

          {error ? (
            <p className="text-sm text-[var(--critical)]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3 text-base font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
          >
            Accedi
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--muted-foreground)]">
          <Link
            href="/forgot-password"
            className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
          >
            Password dimenticata?
          </Link>
          {" · "}
          <Link
            href="/register"
            className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
          >
            Crea workspace
          </Link>
        </p>
      </div>
    </main>
  );
}
