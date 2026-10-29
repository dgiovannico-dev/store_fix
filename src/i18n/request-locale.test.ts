import { describe, expect, it } from "vitest";
import { localeFromAcceptLanguage } from "./request-locale";

describe("localeFromAcceptLanguage", () => {
  it("default it se header assente", () => {
    expect(localeFromAcceptLanguage(null)).toBe("it");
  });

  it("preferisce en se primo tag è inglese", () => {
    expect(localeFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
    expect(localeFromAcceptLanguage("en")).toBe("en");
  });

  it("resta it per italiano o altri", () => {
    expect(localeFromAcceptLanguage("it-IT,it;q=0.9")).toBe("it");
    expect(localeFromAcceptLanguage("de-DE,de;q=0.8")).toBe("it");
  });
});
