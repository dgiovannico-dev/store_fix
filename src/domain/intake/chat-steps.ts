/** Step wizard intake chat-like (F2-01) — senza gateway esterno. */

/** Catalogo categorie: slug SoR + etichetta IT UI (retro F2 #5). */
export const INTAKE_CATEGORIES = [
  { value: "frigo", label: "Frigo / refrigerazione" },
  { value: "hvac", label: "Clima / HVAC" },
  { value: "casse", label: "Casse / POS" },
  { value: "illuminazione", label: "Illuminazione" },
  { value: "porte", label: "Porte / serrande" },
  { value: "altro", label: "Altro" },
] as const;

export type IntakeCategory = (typeof INTAKE_CATEGORIES)[number]["value"];

/** Tuple non-vuota per `z.enum` (create ticket). */
export const INTAKE_CATEGORY_VALUES: [IntakeCategory, ...IntakeCategory[]] = [
  INTAKE_CATEGORIES[0].value,
  ...INTAKE_CATEGORIES.slice(1).map((c) => c.value),
];

export function intakeCategoryLabel(slug: string): string {
  const hit = INTAKE_CATEGORIES.find((c) => c.value === slug);
  return hit?.label ?? slug;
}

export const INTAKE_PRIORITIES = [
  { value: "low", label: "Bassa" },
  { value: "normal", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Critica" },
] as const;

export function intakePriorityLabel(slug: string): string {
  const hit = INTAKE_PRIORITIES.find((p) => p.value === slug);
  return hit?.label ?? slug;
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
