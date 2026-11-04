import { describe, expect, it } from "vitest";
import { listContractPerformance } from "./performance-query";

describe("listContractPerformance (characterization)", () => {
  it("rejects empty tenantId", async () => {
    await expect(
      listContractPerformance("", new Date()),
    ).rejects.toThrow();
  });
});
