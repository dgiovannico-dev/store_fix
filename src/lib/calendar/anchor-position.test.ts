import { describe, expect, it } from "vitest";
import { positionNearAnchor } from "./anchor-position";

describe("positionNearAnchor", () => {
  const popover = { width: 320, height: 360 };
  const viewport = { width: 1280, height: 800 };

  it("prefers the right of the anchor when there is room", () => {
    const pos = positionNearAnchor(
      { top: 120, left: 200, width: 80, height: 40, bottom: 160, right: 280 },
      popover,
      viewport,
    );
    expect(pos.placement).toBe("right");
    expect(pos.left).toBe(288);
    expect(pos.top).toBe(120);
  });

  it("flips left near the right edge", () => {
    const pos = positionNearAnchor(
      {
        top: 100,
        left: 1100,
        width: 100,
        height: 40,
        bottom: 140,
        right: 1200,
      },
      popover,
      viewport,
    );
    expect(pos.placement).toBe("left");
    expect(pos.left).toBeLessThan(1100);
  });

  it("clamps inside the viewport", () => {
    const pos = positionNearAnchor(
      { top: 10, left: 10, width: 40, height: 40, bottom: 50, right: 50 },
      { width: 400, height: 700 },
      { width: 420, height: 720 },
    );
    expect(pos.left).toBeGreaterThanOrEqual(8);
    expect(pos.top).toBeGreaterThanOrEqual(8);
    expect(pos.left + 400).toBeLessThanOrEqual(412);
    expect(pos.top + 700).toBeLessThanOrEqual(712);
  });
});
