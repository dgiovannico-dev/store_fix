import Link from "next/link";
import { redirect } from "next/navigation";
import { resetPassword } from "@/domain/auth/password-reset";
import { AuthMistWash } from "@/components/auth/auth-mist-wash";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { StatusPanel } from "@/components/ui/status-panel";
import { actionResultError } from "@/i18n/domain-errors";
import { requestLocale, requestMessages } from "@/i18n/request-locale";

type Props = {
  searchParams: Promise<{ token?: string; email?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const [msgCatalog, locale] = await Promise.all([
    requestMessages(),
    requestLocale(),
  ]);
  const msg = msgCatalog.auth;
  const params = await searchParams;
  if (!params.token || !params.email) {
    return (
      <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
        <AuthMistWash />
        <div className="relative z-10 w-full max-w-md space-y-4">
          <h1 className="font-[family-name:var(--font-sora)] text-3xl font-semibold text-[var(--primary)]">
            FacilityFlow
          </h1>
          <StatusPanel
            kind="error"
            title={msg.resetIncomplete}
            locale={locale}
          />
          <Link
            href="/forgot-password"
            className="inline-block text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
          >
            {msg.requestNewLink}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      <AuthMistWash />
      <div className="relative z-10 w-full max-w-md space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-3xl font-semibold text-[var(--primary)]">
            FacilityFlow
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {msg.newPasswordTitle}
          </p>
        </div>
        {params.error ? (
          <StatusPanel kind="error" title={params.error} locale={locale} />
        ) : null}
        <form
          className="space-y-4"
          action={async (fd) => {
            "use server";
            const result = await resetPassword({
              email: params.email!,
              rawToken: params.token!,
              newPassword: String(fd.get("password") ?? ""),
            });
            if (!result.ok) {
              const error = await actionResultError(result);
              redirect(
                `/reset-password?token=${params.token}&email=${encodeURIComponent(params.email!)}&error=${encodeURIComponent(error)}`,
              );
            }
            redirect("/login");
          }}
        >
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={msg.newPasswordPlaceholder}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5"
          />
          <PendingSubmitButton
            size="lg"
            className="w-full"
            label={msg.savePassword}
            pendingLabel={msg.savingPassword}
          />
        </form>
      </div>
    </main>
  );
}
