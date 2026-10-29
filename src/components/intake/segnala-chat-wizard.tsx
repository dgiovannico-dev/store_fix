"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import {
  createTicketAction,
  type CreateTicketState,
} from "@/app/actions/tickets";
import {
  canAdvanceIntake,
  intakeCategoryLabel,
  intakeCategoryOptions,
  intakePriorityLabel,
  intakePriorityOptions,
  intakeStepCount,
  intakeStepIndex,
  nextIntakeStep,
  prevIntakeStep,
  type IntakeDraft,
  type IntakeStepId,
} from "@/domain/intake/chat-steps";
import { StatusPanel } from "@/components/ui/status-panel";
import type { Locale, MessageCatalog } from "@/i18n";

type AssetOpt = { id: string; label: string };

const initial: CreateTicketState = {};

type Props = {
  storeId: string;
  storeName: string;
  assets: AssetOpt[];
  locale?: Locale;
  labels: MessageCatalog["intake"];
};

export function SegnalaChatWizard({
  storeId,
  storeName,
  assets,
  locale = "it",
  labels,
}: Props) {
  const [step, setStep] = useState<IntakeStepId>("category");
  const [draft, setDraft] = useState<IntakeDraft>({
    category: "frigo",
    priority: "normal",
    assetId: "",
    description: "",
  });
  const [state, action, pending] = useActionState(createTicketAction, initial);
  const [aiHint, setAiHint] = useState<{
    category: string;
    rationale: string;
    source: string;
  } | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();

  const categories = intakeCategoryOptions(locale);
  const priorities = intakePriorityOptions(locale);
  const prompts: Record<IntakeStepId, string> = {
    category: labels.promptCategory,
    priority: labels.promptPriority,
    asset: labels.promptAsset,
    description: labels.promptDescription,
    confirm: labels.promptConfirm,
  };

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const stepN = intakeStepIndex(step);
  const total = intakeStepCount();
  const canNext = canAdvanceIntake(step, draft);
  const stepOf = labels.stepOf
    .replace("{n}", String(stepN))
    .replace("{total}", String(total));
  const stepAria = labels.stepAria
    .replace("{n}", String(stepN))
    .replace("{total}", String(total));

  function goNext() {
    if (!canNext) return;
    const n = nextIntakeStep(step);
    if (n) setStep(n);
  }

  function goBack() {
    const p = prevIntakeStep(step);
    if (p) setStep(p);
  }

  const assetLabel =
    assets.find((a) => a.id === draft.assetId)?.label ?? labels.noneAsset;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/app/segnala"
          className="text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline"
        >
          {labels.backHub}
        </Link>
        <span className="text-xs text-[var(--muted-foreground)]">{stepOf}</span>
      </div>

      <h1 className="mt-4 font-[family-name:var(--font-sora)] text-xl font-semibold text-[var(--primary)]">
        {labels.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{storeName}</p>

      <ol className="mt-4 flex gap-1" aria-label={stepAria}>
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < stepN ? "bg-[var(--primary)]" : "bg-[var(--border)]"
            }`}
            aria-current={i + 1 === stepN ? "step" : undefined}
          />
        ))}
      </ol>

      <div className="mt-6 flex flex-1 flex-col gap-3">
        <div
          className="max-w-[85%] rounded-2xl rounded-bl-md bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--secondary-foreground)]"
          role="status"
        >
          {prompts[step]}
        </div>

        <h2
          ref={headingRef}
          id={headingId}
          tabIndex={-1}
          className="sr-only"
        >
          {prompts[step]}
        </h2>

        {step === "category" ? (
          <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby={headingId}>
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, category: c.value }));
                  setStep("priority");
                }}
                className={`rounded-[var(--radius)] border px-3 py-3 text-left text-sm font-medium ${
                  draft.category === c.value
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border-[var(--border)] bg-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : null}

        {step === "priority" ? (
          <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby={headingId}>
            {priorities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, priority: p.value }));
                  setStep("asset");
                }}
                className={`rounded-[var(--radius)] border px-3 py-3 text-left text-sm font-medium ${
                  draft.priority === p.value
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border-[var(--border)] bg-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        ) : null}

        {step === "asset" ? (
          <div className="space-y-2" role="group" aria-labelledby={headingId}>
            <button
              type="button"
              onClick={() => {
                setDraft((d) => ({ ...d, assetId: "" }));
                setStep("description");
              }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-3 text-left text-sm"
            >
              {labels.noAsset}
            </button>
            {assets.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, assetId: a.id }));
                  setStep("description");
                }}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-3 text-left text-sm"
              >
                {a.label}
              </button>
            ))}
          </div>
        ) : null}

        {step === "description" ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium" htmlFor="desc">
              {labels.descriptionLabel}
            </label>
            <textarea
              id="desc"
              value={draft.description}
              onChange={(e) => {
                setAiHint(null);
                setDraft((d) => ({ ...d, description: e.target.value }));
              }}
              minLength={5}
              rows={4}
              placeholder={labels.descriptionPlaceholder}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-3 text-base"
            />
            <button
              type="button"
              disabled={aiPending || draft.description.trim().length < 5}
              onClick={async () => {
                setAiPending(true);
                setAiHint(null);
                try {
                  const res = await fetch("/api/ai/suggest-category", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      description: draft.description,
                    }),
                  });
                  if (!res.ok) return;
                  const data = (await res.json()) as {
                    category: string;
                    rationale: string;
                    source: string;
                  };
                  setAiHint(data);
                } finally {
                  setAiPending(false);
                }
              }}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {aiPending ? labels.suggestAiPending : labels.suggestAi}
            </button>
            {aiHint ? (
              <div className="rounded-[var(--radius)] border border-[var(--border)] p-3 text-sm">
                <p>
                  {labels.suggestedPrefix}{" "}
                  <strong>
                    {intakeCategoryLabel(aiHint.category, locale)}
                  </strong>{" "}
                  ({aiHint.source})
                </p>
                <p className="mt-1 text-[var(--muted-foreground)]">
                  {aiHint.rationale}
                </p>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
                  onClick={() => {
                    setDraft((d) => ({
                      ...d,
                      category: aiHint.category,
                    }));
                    setAiHint(null);
                  }}
                >
                  {labels.useSuggestion}
                </button>
              </div>
            ) : null}
            <button
              type="button"
              disabled={!canNext}
              onClick={goNext}
              className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3.5 text-base font-medium text-[var(--primary-foreground)] disabled:opacity-60"
            >
              {labels.continue}
            </button>
          </div>
        ) : null}

        {step === "confirm" ? (
          <form action={action} className="space-y-3">
            <input type="hidden" name="storeId" value={storeId} />
            <input type="hidden" name="category" value={draft.category} />
            <input type="hidden" name="priority" value={draft.priority} />
            <input type="hidden" name="assetId" value={draft.assetId} />
            <input
              type="hidden"
              name="description"
              value={draft.description}
            />
            <ul className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] p-3 text-sm">
              <li>
                <span className="text-[var(--muted-foreground)]">
                  {labels.labelCategory}
                </span>{" "}
                {intakeCategoryLabel(draft.category, locale)}
              </li>
              <li>
                <span className="text-[var(--muted-foreground)]">
                  {labels.labelPriority}
                </span>{" "}
                {intakePriorityLabel(draft.priority, locale)}
              </li>
              <li>
                <span className="text-[var(--muted-foreground)]">
                  {labels.labelAsset}
                </span>{" "}
                {assetLabel}
              </li>
              <li>
                <span className="text-[var(--muted-foreground)]">
                  {labels.labelDetail}
                </span>{" "}
                {draft.description}
              </li>
            </ul>
            {state.error ? (
              <StatusPanel
                kind="error"
                title={state.error}
                locale={locale}
              />
            ) : null}
            <button
              type="submit"
              disabled={pending || !canAdvanceIntake("confirm", draft)}
              className="w-full rounded-[var(--radius)] bg-[var(--primary)] px-4 py-3.5 text-base font-medium text-[var(--primary-foreground)] disabled:opacity-60"
            >
              {pending ? labels.opening : labels.openTicket}
            </button>
          </form>
        ) : null}
      </div>

      {step !== "category" ? (
        <button
          type="button"
          onClick={goBack}
          className="mt-6 text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline"
        >
          {labels.back}
        </button>
      ) : null}

      <p className="mt-4 text-xs text-[var(--muted-foreground)]">
        {labels.afterOpenHint}
      </p>
    </main>
  );
}
