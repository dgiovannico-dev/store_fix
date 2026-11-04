import { describe, expect, it } from "vitest";
import { listChargebackByStore } from "./chargeback-query";

describe("listChargebackByStore (characterization)", () => {
  it("rejects empty tenantId", async () => {
    await expect(listChargebackByStore("", 30)).rejects.toThrow();
  });
});
