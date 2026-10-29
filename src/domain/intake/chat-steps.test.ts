import { describe, expect, it } from "vitest";
import {
  canAdvanceIntake,
  intakeCategoryLabel,
  intakePriorityLabel,
  intakeStepCount,
  INTAKE_CATEGORY_VALUES,
  nextIntakeStep,
  prevIntakeStep,
  type IntakeDraft,
} from "./chat-steps";

const base: IntakeDraft = {
  category: "frigo",
  priority: "normal",
  assetId: "",
  description: "Frigo caldo sopra 8 gradi",
};

describe("intake chat-steps", () => {
  it("naviga avanti/indietro", () => {
    expect(nextIntakeStep("category")).toBe("priority");
    expect(prevIntakeStep("priority")).toBe("category");
    expect(nextIntakeStep("confirm")).toBeNull();
    expect(prevIntakeStep("category")).toBeNull();
    expect(intakeStepCount()).toBe(5);
  });

  it("valida avanzamento per step", () => {
    expect(canAdvanceIntake("category", { ...base, category: "x" })).toBe(
      false,
    );
    expect(canAdvanceIntake("category", base)).toBe(true);
    expect(
      canAdvanceIntake("description", { ...base, description: "ab" }),
    ).toBe(false);
    expect(canAdvanceIntake("asset", base)).toBe(true);
    expect(canAdvanceIntake("confirm", base)).toBe(true);
  });

  it("etichette IT per slug (fallback legacy)", () => {
    expect(INTAKE_CATEGORY_VALUES).toContain("frigo");
    expect(intakeCategoryLabel("frigo")).toMatch(/Frigo/i);
    expect(intakeCategoryLabel("frigo", "en")).toMatch(/Fridge/i);
    expect(intakeCategoryLabel("legacy-xyz")).toBe("legacy-xyz");
    expect(intakePriorityLabel("critical")).toBe("Critica");
    expect(intakePriorityLabel("critical", "en")).toBe("Critical");
  });
});
