import { describe, expect, it } from "vitest";
import {
  isSessionIdleExpired,
  nextLastActiveAt,
  resolveSessionIdleSec,
  SESSION_IDLE_TOUCH_EVERY_SEC,
} from "./session-idle";

describe("resolveSessionIdleSec", () => {
  it("default off", () => {
    expect(resolveSessionIdleSec({})).toBe(0);
    expect(resolveSessionIdleSec({ AUTH_SESSION_IDLE_SEC: "" })).toBe(0);
    expect(resolveSessionIdleSec({ AUTH_SESSION_IDLE_SEC: "abc" })).toBe(0);
  });

  it("parse secondi positivi", () => {
    expect(resolveSessionIdleSec({ AUTH_SESSION_IDLE_SEC: "28800" })).toBe(
      28800,
    );
  });
});

describe("isSessionIdleExpired", () => {
  it("false se idle disabilitato o lastActive assente", () => {
    expect(isSessionIdleExpired(100, 0, 200)).toBe(false);
    expect(isSessionIdleExpired(undefined, 60, 200)).toBe(false);
  });

  it("true oltre la finestra idle", () => {
    expect(isSessionIdleExpired(100, 60, 161)).toBe(true);
    expect(isSessionIdleExpired(100, 60, 160)).toBe(false);
  });
});

describe("nextLastActiveAt", () => {
  it("non riscrive dentro la finestra touch", () => {
    const last = 1000;
    expect(
      nextLastActiveAt(last, last + SESSION_IDLE_TOUCH_EVERY_SEC - 1),
    ).toBe(last);
  });

  it("aggiorna dopo touchEvery", () => {
    const last = 1000;
    const now = last + SESSION_IDLE_TOUCH_EVERY_SEC;
    expect(nextLastActiveAt(last, now)).toBe(now);
  });
});
