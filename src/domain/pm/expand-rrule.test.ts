import { describe, expect, it } from "vitest";
import { expandRruleOccurrences, rrulePreset } from "./expand-rrule";

describe("expandRruleOccurrences", () => {
  it("espande mensile Jan–Mar UTC (3 occorrenze)", () => {
    const dtstart = new Date(Date.UTC(2026, 0, 15, 9, 0, 0));
    const from = new Date(Date.UTC(2026, 0, 1));
    const to = new Date(Date.UTC(2026, 3, 1));
    const dates = expandRruleOccurrences({
      rrule: rrulePreset("monthly"),
      dtstart,
      from,
      to,
    });
    expect(dates.map((d) => d.toISOString())).toEqual([
      "2026-01-15T09:00:00.000Z",
      "2026-02-15T09:00:00.000Z",
      "2026-03-15T09:00:00.000Z",
    ]);
  });

  it("rrule invalida → []", () => {
    const fixed = new Date(Date.UTC(2026, 5, 1));
    expect(
      expandRruleOccurrences({
        rrule: "NOT_A_RULE",
        dtstart: fixed,
        from: fixed,
        to: new Date(Date.UTC(2026, 5, 2)),
      }),
    ).toEqual([]);
  });
});
