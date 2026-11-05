import { describe, expect, it } from "vitest";
import { aiInvocationRetentionDays } from "./gc-ai-invocations";

describe("aiInvocationRetentionDays", () => {
  it("defaults to 90", () => {
    const prev = process.env.AI_INVOCATION_RETENTION_DAYS;
    delete process.env.AI_INVOCATION_RETENTION_DAYS;
    expect(aiInvocationRetentionDays()).toBe(90);
    if (prev !== undefined) process.env.AI_INVOCATION_RETENTION_DAYS = prev;
  });

  it("rejects values under 7", () => {
    const prev = process.env.AI_INVOCATION_RETENTION_DAYS;
    process.env.AI_INVOCATION_RETENTION_DAYS = "3";
    expect(aiInvocationRetentionDays()).toBe(90);
    if (prev === undefined) delete process.env.AI_INVOCATION_RETENTION_DAYS;
    else process.env.AI_INVOCATION_RETENTION_DAYS = prev;
  });
});
