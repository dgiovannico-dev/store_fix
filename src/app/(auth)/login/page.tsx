import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAuthCredentialsEnabled, isAuthOidcEnabled } from "@/auth";
import { loginAction } from "@/app/actions/login";
import { loginOidcAction } from "@/app/actions/login-oidc";
import { AuthMistWash } from "@/components/auth/auth-mist-wash";
import { Input } from "@/components/ui/input";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { StatusPanel } from "@/components/ui/status-panel";
import { requestLocale, requestMessages } from "@/i18n/request-locale";

type Props = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/onboarding");
  }

  const [msgCatalog, locale] = await Promise.all([
    requestMessages(),
    requestLocale(),
  ]);
  const msg = msgCatalog.auth;
  const params = await searchParams;
  const showCredentials = isAuthCredentialsEnabled();
  const showOidc = isAuthOidcEnabled();
  const error =
    params.error === "CredentialsSignin"
      ? msg.errCredentials
      : params.error === "RateLimit"
        ? msg.errRateLimit
        : params.error
          ? msg.errGeneric
          : null;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      <AuthMistWash />

      <div className="relative z-10 w-full max-w-md">
        <h1 className="font-[family-name:var(--font-sora)] text-4xl font-semibold tracking-tight text-[var(--primary)] sm:text-5xl">
          FacilityFlow
        </h1>
        <p className="mt-3 max-w-sm text-[var(--muted-foreground)]">
          {msg.tagline}
        </p>

        {showOidc ? (
          <form className="mt-10" action={loginOidcAction}>
            <input
              type="hidden"
              name="callbackUrl"
              value={params.callbackUrl ?? "/onboarding"}
            />
            <PendingSubmitButton
              variant="outline"
              size="lg"
              className="w-full"
              label={msg.signInOidc}
              pendingLabel={msg.signingIn}
            />
          </form>
        ) : null}

        {showOidc && showCredentials ? (
          <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
            {msg.orEmail}
          </p>
        ) : null}

        {showCredentials ? (
          <form
            className={showOidc ? "mt-4 space-y-5" : "mt-10 space-y-5"}
            action={loginAction}
          >
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
                {msg.email}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--foreground)]"
              >
                {msg.password}
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
              />
            </div>

            {error ? (
              <StatusPanel kind="error" title={error} locale={locale} />
            ) : null}

            <PendingSubmitButton
              size="lg"
              className="w-full"
              label={msg.signIn}
              pendingLabel={msg.signingIn}
            />
          </form>
        ) : error ? (
          <div className="mt-8">
            <StatusPanel kind="error" title={error} locale={locale} />
          </div>
        ) : null}

        {showCredentials ? (
          <p className="mt-6 text-sm text-[var(--muted-foreground)]">
            <Link
              href="/forgot-password"
              className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
            >
              {msg.forgot}
            </Link>
            {" · "}
            <Link
              href="/register"
              className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
            >
              {msg.createWorkspace}
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
