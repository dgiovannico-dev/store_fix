import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import {
  ensureSlaDefaultsAction,
  resumeOnboardingAction,
  skipOnboardingAction,
} from "@/app/actions/onboarding";
import { getOnboardingSnapshot } from "@/domain/onboarding/progress";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    redirect("/login");
  }

  const snap = await getOnboardingSnapshot(session.tenantId);
  const pct = Math.round((snap.doneCount / Math.max(snap.totalCount, 1)) * 100);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            FacilityFlow · Setup rete
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Completa la rete in meno di 15 minuti
          </p>
        </div>
        {!snap.skippedAt && !snap.networkComplete ? (
          <form action={skipOnboardingAction}>
            <button
              type="submit"
              className="text-sm text-[var(--signal-foreground)] underline-offset-4 hover:underline"
              title="Puoi riprendere dalla dashboard. Alcuni KPI resteranno vuoti."
            >
              Salta ⚠
            </button>
          </form>
        ) : null}
      </header>

      {snap.skippedAt ? (
        <div className="rounded-[var(--radius)] border border-[var(--signal)] bg-[oklch(0.96_0.04_85)] px-4 py-3 text-sm">
          Onboarding saltato. Alcuni KPI resteranno vuoti.{" "}
          <form action={resumeOnboardingAction} className="inline">
            <button type="submit" className="font-medium underline-offset-4 hover:underline">
              Riprendi
            </button>
          </form>
        </div>
      ) : null}

      <div>
        <div className="mb-1 flex justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            {snap.doneCount}/{snap.totalCount} step rete
          </span>
          <span>{pct}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-[var(--muted)]"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[var(--primary)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="space-y-3">
        {snap.steps.map((step, idx) => (
          <li
            key={step.id}
            className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] px-3 py-3"
          >
            <span
              className={
                step.done
                  ? "text-[var(--success)]"
                  : "text-[var(--muted-foreground)]"
              }
              aria-hidden
            >
              {step.done ? "✓" : "○"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {idx + 1}. {step.label}
                {step.blocked ? (
                  <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
                    (S2)
                  </span>
                ) : null}
              </p>
              {step.id === "sla" && !step.done ? (
                <form action={ensureSlaDefaultsAction} className="mt-2">
                  <button
                    type="submit"
                    className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
                  >
                    Applica SLA default IT
                  </button>
                </form>
              ) : step.id === "sample_ticket" ? (
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Ticket di prova opzionale — apri da Segnala o lista ticket quando la rete è pronta.
                </p>
              ) : !step.done && !step.blocked ? (
                <Link
                  href={step.href}
                  className="mt-1 inline-block text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
                >
                  Continua →
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {snap.networkComplete ? (
        <p className="text-sm text-[var(--success)]">
          Rete pronta. Puoi aprire la dashboard.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/app/tickets/new"
          className="rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          Nuovo ticket
        </Link>
        <Link
          href="/app/dashboard"
          className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Dashboard
        </Link>
        <Link
          href="/app/stores"
          className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Store
        </Link>
        <Link
          href="/app/vendors"
          className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Fornitori
        </Link>
        <Link
          href="/app/assets"
          className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Asset
        </Link>
        <Link
          href="/app/settings/members"
          className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm font-medium"
        >
          Membri
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2 text-sm"
          >
            Esci
          </button>
        </form>
      </div>
    </main>
  );
}
