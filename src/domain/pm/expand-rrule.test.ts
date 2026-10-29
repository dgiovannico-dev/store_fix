import { describe, expect, it } from "vitest";
import { expandRruleOccurrences, rrulePreset } from "./expand-rrule";

describe("expandRruleOccurrences", () => {
  it("espande mensile nel orizzonte", () => {
    const dtstart = new Date(Date.UTC(2026, 0, 15, 9, 0, 0));
    const from = new Date(Date.UTC(2026, 0, 1));
    const to = new Date(Date.UTC(2026, 3, 1));
    const dates = expandRruleOccurrences({
      rrule: rrulePreset("monthly"),
      dtstart,
      from,
      to,
    });
    expect(dates.length).toBeGreaterThanOrEqual(2);
    expect(dates.length).toBeLessThanOrEqual(4);
  });

  it("rrule invalida → []", () => {
    expect(
      expandRruleOccurrences({
        rrule: "NOT_A_RULE",
        dtstart: new Date(),
        from: new Date(),
        to: new Date(Date.now() + 86400000),
      }),
    ).toEqual([]);
  });
});
