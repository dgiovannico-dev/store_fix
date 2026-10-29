/** Step wizard intake chat-like (F2-01) — senza gateway esterno. */

import { t, type Locale } from "@/i18n";

/** Catalogo categorie: slug SoR (etichette via i18n). */
export const INTAKE_CATEGORIES = [
  { value: "frigo" },
  { value: "hvac" },
  { value: "casse" },
  { value: "illuminazione" },
  { value: "porte" },
  { value: "altro" },
] as const;

export type IntakeCategory = (typeof INTAKE_CATEGORIES)[number]["value"];

/** Tuple non-vuota per `z.enum` (create ticket). */
export const INTAKE_CATEGORY_VALUES: [IntakeCategory, ...IntakeCategory[]] = [
  INTAKE_CATEGORIES[0].value,
  ...INTAKE_CATEGORIES.slice(1).map((c) => c.value),
];

export function intakeCategoryLabel(
  slug: string,
  locale: Locale = "it",
): string {
  const cat = t(locale).intake;
  const map: Record<string, string> = {
    frigo: cat.catFrigo,
    hvac: cat.catHvac,
    casse: cat.catCasse,
    illuminazione: cat.catIlluminazione,
    porte: cat.catPorte,
    altro: cat.catAltro,
  };
  return map[slug] ?? slug;
}

export const INTAKE_PRIORITIES = [
  { value: "low" },
  { value: "normal" },
  { value: "high" },
  { value: "critical" },
] as const;

export type IntakePriority = (typeof INTAKE_PRIORITIES)[number]["value"];

export function intakePriorityLabel(
  slug: string,
  locale: Locale = "it",
): string {
  const cat = t(locale).intake;
  const map: Record<string, string> = {
    low: cat.priLow,
    normal: cat.priNormal,
    high: cat.priHigh,
    critical: cat.priCritical,
  };
  return map[slug] ?? slug;
}

export type IntakeStepId =
  | "category"
  | "priority"
  | "asset"
  | "description"
  | "confirm";

export const INTAKE_STEPS: IntakeStepId[] = [
  "category",
  "priority",
  "asset",
  "description",
  "confirm",
];

export function nextIntakeStep(
  current: IntakeStepId,
): IntakeStepId | null {
  const i = INTAKE_STEPS.indexOf(current);
  if (i < 0 || i >= INTAKE_STEPS.length - 1) return null;
  return INTAKE_STEPS[i + 1]!;
}

export function prevIntakeStep(
  current: IntakeStepId,
): IntakeStepId | null {
  const i = INTAKE_STEPS.indexOf(current);
  if (i <= 0) return null;
  return INTAKE_STEPS[i - 1]!;
}

export function intakeStepIndex(step: IntakeStepId): number {
  return INTAKE_STEPS.indexOf(step) + 1;
}

export function intakeStepCount(): number {
  return INTAKE_STEPS.length;
}

export type IntakeDraft = {
  category: string;
  priority: string;
  assetId: string;
  description: string;
};

export function canAdvanceIntake(
  step: IntakeStepId,
  draft: IntakeDraft,
): boolean {
  switch (step) {
    case "category":
      return INTAKE_CATEGORY_VALUES.includes(
        draft.category as IntakeCategory,
      );
    case "priority":
      return INTAKE_PRIORITIES.some((p) => p.value === draft.priority);
    case "asset":
      return true; // opzionale
    case "description":
      return draft.description.trim().length >= 5;
    case "confirm":
      return (
        canAdvanceIntake("category", draft) &&
        canAdvanceIntake("priority", draft) &&
        canAdvanceIntake("description", draft)
      );
    default:
      return false;
  }
}
