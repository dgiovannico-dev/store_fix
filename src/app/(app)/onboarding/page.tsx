import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  ensureSlaDefaultsAction,
  resumeOnboardingAction,
  skipOnboardingAction,
} from "@/app/actions/onboarding";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import {
  getOnboardingSnapshot,
  type OnboardingStepId,
} from "@/domain/onboarding/progress";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    redirect("/login");
  }

  const [snap, msg] = await Promise.all([
    getOnboardingSnapshot(session.tenantId),
    tenantMessages(session.tenantId),
  ]);
  const pct = Math.round((snap.doneCount / Math.max(snap.totalCount, 1)) * 100);
  const copy = msg.onboarding;
  const stepLabel: Record<OnboardingStepId, string> = {
    stores: copy.stepStores,
    vendors: copy.stepVendors,
    sla: copy.stepSla,
    invite_sm: copy.stepInviteSm,
    sample_ticket: copy.stepSample,
  };

  return (
    <PageFrame narrow className="flex flex-col gap-6" data-tour="hq.onboarding">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {copy.hint}
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Pilota tipico: 15 store × 5 vendor. Per capire ogni sezione usa{" "}
            <strong className="font-medium text-[var(--foreground)]">
              Aiuto → Tutorial interattivo
            </strong>{" "}
            (o tasto <kbd className="rounded border px-1">?</kbd>) — non
            sostituisce questa checklist.
          </p>
        </div>
        {!snap.skippedAt && !snap.networkComplete ? (
          <form action={skipOnboardingAction}>
            <button
              type="submit"
              className="text-sm text-[var(--signal-foreground)] underline-offset-4 hover:underline"
              title={copy.skipTitle}
            >
              {copy.skip}
            </button>
          </form>
        ) : null}
      </header>

      {snap.skippedAt ? (
        <div className="rounded-[var(--radius)] border border-[var(--signal)] bg-[oklch(0.96_0.04_85)] px-4 py-3 text-sm">
          {copy.skippedBanner}{" "}
          <form action={resumeOnboardingAction} className="inline">
            <button
              type="submit"
              className="font-medium underline-offset-4 hover:underline"
            >
              {copy.resume}
            </button>
          </form>
        </div>
      ) : null}

      <div>
        <div className="mb-1 flex justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            {snap.doneCount}/{snap.totalCount} {copy.stepsLabel}
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
                {idx + 1}. {stepLabel[step.id]}
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
                    {copy.applySla}
                  </button>
                </form>
              ) : step.id === "sample_ticket" ? (
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {copy.sampleHint}
                </p>
              ) : !step.done && !step.blocked ? (
                <Link
                  href={step.href}
                  className="mt-1 inline-block text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
                >
                  {copy.continue}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {snap.networkComplete ? (
        <p className="text-sm text-[var(--success)]">{copy.networkReady}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button asChild size="sm">
          <Link href="/app/tickets/new">{msg.dashboard.ctaTicket}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/dashboard">{msg.nav.dashboard}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/stores">{msg.nav.stores}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/vendors">{msg.nav.vendors}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/assets">{msg.assets.title}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/settings/members">{msg.audit.membersLink}</Link>
        </Button>
        <form action="/logout" method="post">
          <Button type="submit" variant="outline" size="sm">
            {msg.nav.signOut}
          </Button>
        </form>
      </div>
    </PageFrame>
  );
}
