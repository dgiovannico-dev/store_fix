import { describe, expect, it } from "vitest";
import {
  isWallboardReturnPath,
  safeAppReturnPath,
} from "./safe-return-path";

describe("safeAppReturnPath", () => {
  it("allows /app paths", () => {
    expect(safeAppReturnPath("/app/wallboard")).toBe("/app/wallboard");
  });

  it("rejects open redirects", () => {
    expect(safeAppReturnPath("https://evil.example")).toBe("/app/tickets");
    expect(safeAppReturnPath("//evil.example")).toBe("/app/tickets");
    expect(safeAppReturnPath("/login")).toBe("/app/tickets");
  });
});

describe("isWallboardReturnPath", () => {
  it("detects wallboard", () => {
    expect(isWallboardReturnPath("/app/wallboard")).toBe(true);
    expect(isWallboardReturnPath("/app/tickets")).toBe(false);
  });
});
