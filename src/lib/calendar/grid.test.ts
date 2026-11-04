import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  buildWeekDays,
  formatHhMm,
  hoursInRange,
  mondayIndex,
  startOfWeekMonday,
  toYmd,
} from "./grid";

describe("calendar grid", () => {
  it("maps Monday as week start (IT)", () => {
    // 2026-11-04 is Wednesday
    const wed = new Date(2026, 10, 4);
    expect(mondayIndex(wed)).toBe(2);
    expect(toYmd(startOfWeekMonday(wed))).toBe("2026-11-02");
  });

  it("builds a 42-cell month grid Monday-first", () => {
    const cells = buildMonthGrid(new Date(2026, 10, 1));
    expect(cells).toHaveLength(42);
    expect(toYmd(cells[0]!)).toBe("2026-10-26");
    expect(toYmd(cells[7]!)).toBe("2026-11-02");
  });

  it("builds a 7-day week from Monday", () => {
    const days = buildWeekDays(new Date(2026, 10, 4));
    expect(days).toHaveLength(7);
    expect(toYmd(days[0]!)).toBe("2026-11-02");
    expect(toYmd(days[6]!)).toBe("2026-11-08");
  });

  it("hoursInRange is inclusive (day grid 06–21)", () => {
    const hours = hoursInRange(6, 21);
    expect(hours[0]).toBe(6);
    expect(hours.at(-1)).toBe(21);
    expect(hours).toHaveLength(16);
    expect(formatHhMm(9)).toBe("09:00");
    expect(formatHhMm(14, 30)).toBe("14:30");
  });
});
