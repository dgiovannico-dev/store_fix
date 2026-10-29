import Link from "next/link";
import { redirect } from "next/navigation";
import { resetPassword } from "@/domain/auth/password-reset";
import { t } from "@/i18n";

type Props = {
  searchParams: Promise<{ token?: string; email?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const msg = t("it").auth;
  const params = await searchParams;
  if (!params.token || !params.email) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
        <p className="text-[var(--critical)]">{msg.resetIncomplete}</p>
        <Link href="/forgot-password">{msg.requestNewLink}</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
        {msg.newPasswordTitle}
      </h1>
      {params.error ? (
        <p className="text-sm text-[var(--critical)]" role="alert">
          {params.error}
        </p>
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
            redirect(
              `/reset-password?token=${params.token}&email=${encodeURIComponent(params.email!)}&error=${encodeURIComponent(result.message)}`,
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
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5"
        />
        <button
          type="submit"
          className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3 font-medium text-[var(--primary-foreground)]"
        >
          {msg.savePassword}
        </button>
      </form>
    </main>
  );
}
