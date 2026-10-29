import { describe, expect, it } from "vitest";
import { clientIpFromHeaders, rateLimitKey } from "./client-ip";

describe("clientIpFromHeaders", () => {
  it("preferisce X-Real-IP", () => {
    const h = new Headers({
      "x-real-ip": "203.0.113.9",
      "x-forwarded-for": "1.1.1.1, 10.0.0.1",
    });
    expect(clientIpFromHeaders(h)).toBe("203.0.113.9");
  });

  it("usa rightmost XFF con 1 trusted proxy (default)", () => {
    const h = new Headers({
      "x-forwarded-for": "198.51.100.1, 203.0.113.50",
    });
    expect(clientIpFromHeaders(h, {})).toBe("203.0.113.50");
    expect(clientIpFromHeaders(h, { FF_TRUSTED_PROXY_COUNT: "1" })).toBe(
      "203.0.113.50",
    );
  });

  it("salta N proxy fidati da destra", () => {
    const h = new Headers({
      "x-forwarded-for": "198.51.100.1, 203.0.113.10, 10.0.0.2",
    });
    expect(clientIpFromHeaders(h, { FF_TRUSTED_PROXY_COUNT: "2" })).toBe(
      "203.0.113.10",
    );
  });

  it("fallback local senza header", () => {
    expect(clientIpFromHeaders(new Headers())).toBe("local");
  });

  it("rateLimitKey prefissa", () => {
    const h = new Headers({ "x-real-ip": "203.0.113.1" });
    expect(rateLimitKey("logout", h)).toBe("logout:203.0.113.1");
  });
});
