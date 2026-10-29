import { describe, expect, it } from "vitest";
import { referrerPolicyForPath } from "./referrer-policy";

describe("referrerPolicyForPath", () => {
  it("no-referrer su path con token in query", () => {
    expect(referrerPolicyForPath("/reset-password")).toBe("no-referrer");
    expect(referrerPolicyForPath("/verify-email/")).toBe("no-referrer");
    expect(referrerPolicyForPath("/invite/abc")).toBe("no-referrer");
  });

  it("strict-origin su login/register/logout", () => {
    expect(referrerPolicyForPath("/login")).toBe("strict-origin");
    expect(referrerPolicyForPath("/register")).toBe("strict-origin");
    expect(referrerPolicyForPath("/logout")).toBe("strict-origin");
  });

  it("default strict-origin-when-cross-origin altrove", () => {
    expect(referrerPolicyForPath("/app/tickets")).toBe(
      "strict-origin-when-cross-origin",
    );
  });
});
