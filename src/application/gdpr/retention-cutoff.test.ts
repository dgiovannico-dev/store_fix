import { describe, expect, it } from "vitest";
import {
  retentionCutoff,
  VERIFIED_RETENTION_MONTHS,
} from "./purge-expired";

describe("retentionCutoff", () => {
  it("sottrae 24 mesi UTC da verifiedAt", () => {
    const now = new Date("2026-10-29T12:00:00.000Z");
    const cut = retentionCutoff(now, VERIFIED_RETENTION_MONTHS);
    expect(cut.toISOString()).toBe("2024-10-29T12:00:00.000Z");
  });

  it("accetta mesi custom", () => {
    const now = new Date("2026-06-15T00:00:00.000Z");
    expect(retentionCutoff(now, 6).toISOString()).toBe(
      "2025-12-15T00:00:00.000Z",
    );
  });
});
