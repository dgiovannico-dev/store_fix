import { describe, expect, it } from "vitest";
import {
  parseOllamaCategoryJson,
  suggestCategoryHeuristic,
} from "./suggest-category";

describe("suggestCategoryHeuristic", () => {
  it("riconosce frigo e hvac", () => {
    expect(suggestCategoryHeuristic("Frigo caldo banco").category).toBe(
      "frigo",
    );
    expect(suggestCategoryHeuristic("Condizionatore rumore").category).toBe(
      "hvac",
    );
    expect(suggestCategoryHeuristic("Qualcosa di vago").category).toBe("altro");
  });
});

describe("parseOllamaCategoryJson", () => {
  it("estrae category da JSON", () => {
    expect(parseOllamaCategoryJson('{"category":"porte"}')).toBe("porte");
    expect(parseOllamaCategoryJson("blah {\"category\": \"casse\" }")).toBe(
      "casse",
    );
    expect(parseOllamaCategoryJson("nope")).toBeNull();
  });
});
