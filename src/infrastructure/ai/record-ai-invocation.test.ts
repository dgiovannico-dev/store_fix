import { describe, expect, it } from "vitest";
import { aiSoftBudgetLimit } from "./record-ai-invocation";

describe("aiSoftBudgetLimit", () => {
  it("defaults to 5000", () => {
    const prev = process.env.AI_SOFT_BUDGET_MONTHLY;
    delete process.env.AI_SOFT_BUDGET_MONTHLY;
    expect(aiSoftBudgetLimit()).toBe(5000);
    if (prev !== undefined) process.env.AI_SOFT_BUDGET_MONTHLY = prev;
  });

  it("reads env positive int", () => {
    const prev = process.env.AI_SOFT_BUDGET_MONTHLY;
    process.env.AI_SOFT_BUDGET_MONTHLY = "100";
    expect(aiSoftBudgetLimit()).toBe(100);
    if (prev === undefined) delete process.env.AI_SOFT_BUDGET_MONTHLY;
    else process.env.AI_SOFT_BUDGET_MONTHLY = prev;
  });
});
