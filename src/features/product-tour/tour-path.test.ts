import { describe, expect, it } from "vitest";
import { stepFitsPath } from "./tour-path";

describe("stepFitsPath", () => {
  it("matches exact route", () => {
    expect(stepFitsPath({ route: "/app/tickets" }, "/app/tickets")).toBe(true);
  });

  it("matches opaque ticket id children", () => {
    expect(
      stepFitsPath({ route: "/app/tickets" }, "/app/tickets/clabc123"),
    ).toBe(true);
  });

  it("rejects named sibling /new after list route", () => {
    expect(stepFitsPath({ route: "/app/tickets" }, "/app/tickets/new")).toBe(
      false,
    );
  });

  it("rejects scorecard/performance siblings", () => {
    expect(
      stepFitsPath({ route: "/app/vendors" }, "/app/vendors/scorecard"),
    ).toBe(false);
    expect(
      stepFitsPath({ route: "/app/contratti" }, "/app/contratti/performance"),
    ).toBe(false);
  });

  it("allows steps without route anywhere", () => {
    expect(stepFitsPath({}, "/app/anything")).toBe(true);
  });
});
