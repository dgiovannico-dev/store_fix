import Link from "next/link";
import { redirect } from "next/navigation";
import { SkipForward } from "lucide-react";
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
import { getTenantI18nPrefs } from "@/application/tenant/i18n-prefs";
import { OnboardingTourLaunch } from "@/features/product-tour/onboarding-tour-launch";
import { tenantMessages } from "@/i18n/tenant-messages";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) {
    redirect("/login");
  }

  const [snap, msg, prefs] = await Promise.all([
    getOnboardingSnapshot(session.tenantId),
    tenantMessages(session.tenantId),
    getTenantI18nPrefs(session.tenantId),
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-[var(--primary)]">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {copy.hint}
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {copy.pilotHint}
          </p>
        </div>
        {!snap.skippedAt && !snap.networkComplete ? (
          <form action={skipOnboardingAction} className="shrink-0 self-start">
            <button
              type="submit"
              title={copy.skipTitle}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--signal)_40%,var(--border))] bg-[color-mix(in_oklab,var(--signal)_8%,var(--card))] px-3.5 py-2 text-sm font-medium text-[var(--signal-foreground)] shadow-sm transition-colors hover:bg-[color-mix(in_oklab,var(--signal)_16%,var(--card))]"
            >
              <SkipForward className="size-3.5 shrink-0" aria-hidden />
              {copy.skip}
            </button>
          </form>
        ) : null}
      </header>

      <OnboardingTourLaunch
        label={copy.tourLaunch}
        hint={copy.tourLaunchHint}
        cta={copy.tourLaunchCta}
        locale={prefs.locale}
      />

      {snap.skippedAt ? (
        <div className="space-y-2 rounded-[var(--radius)] border border-[var(--signal)] bg-[var(--signal-soft)] px-4 py-3 text-sm">
          <p>
            {copy.skippedBanner}{" "}
            <form action={resumeOnboardingAction} className="inline">
              <button
                type="submit"
                className="font-medium underline-offset-4 hover:underline"
              >
                {copy.resume}
              </button>
            </form>
          </p>
          <div>
            <p className="font-medium">{copy.antiSkipTitle}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[var(--muted-foreground)]">
              <li>{copy.antiSkip1}</li>
              <li>{copy.antiSkip2}</li>
              <li>{copy.antiSkip3}</li>
            </ul>
          </div>
        </div>
      ) : null}

      {snap.networkComplete ? (
        <div className="rounded-[var(--radius)] border border-[var(--primary)] bg-[var(--primary-soft)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--primary)]">
            {copy.flussoATitle}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {copy.flussoAHint}
          </p>
          <Link
            href="/app/tickets/new?tour=1"
            className="mt-3 inline-flex rounded-[var(--radius)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {copy.flussoACta}
          </Link>
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
                    {copy.blockedSprintHint}
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
