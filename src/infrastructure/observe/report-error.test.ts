import { afterEach, describe, expect, it, vi } from "vitest";

describe("reportError", () => {
  afterEach(() => {
    delete process.env.SENTRY_DSN;
    vi.resetModules();
  });

  it("non fallisce senza DSN", async () => {
    delete process.env.SENTRY_DSN;
    const { reportError } = await import("./report-error");
    await expect(reportError(new Error("x"), { a: 1 })).resolves.toBeUndefined();
  });
});
