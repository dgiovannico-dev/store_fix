import { describe, expect, it } from "vitest";
import {
  hasSessionCookie,
  requiresAuthSession,
} from "./protected-path";

describe("protected-path", () => {
  it("protegge /app e /vendor", () => {
    expect(requiresAuthSession("/app")).toBe(true);
    expect(requiresAuthSession("/app/tickets")).toBe(true);
    expect(requiresAuthSession("/vendor/inbox")).toBe(true);
    expect(requiresAuthSession("/onboarding")).toBe(true);
  });

  it("lascia pubblici login e api auth", () => {
    expect(requiresAuthSession("/login")).toBe(false);
    expect(requiresAuthSession("/signup")).toBe(false);
    expect(requiresAuthSession("/api/auth/session")).toBe(false);
    expect(requiresAuthSession("/")).toBe(false);
  });

  it("rileva cookie sessione", () => {
    expect(hasSessionCookie("authjs.session-token=abc", false)).toBe(true);
    expect(hasSessionCookie("other=1", false)).toBe(false);
    expect(
      hasSessionCookie("__Secure-authjs.session-token=xyz", true),
    ).toBe(true);
  });
});
