import { describe, expect, it } from "vitest";
import { applyBaselineSecurityHeaders } from "./apply-baseline-security-headers";

describe("applyBaselineSecurityHeaders", () => {
  it("imposta baseline OWASP SHP + CSP + no-store", () => {
    const h = new Headers();
    applyBaselineSecurityHeaders(h, {
      pathname: "/login",
      requestId: "req-test",
      env: {
        NODE_ENV: "production",
        FF_DOMAIN: "",
        FF_CSP_UPGRADE_INSECURE: "0",
      },
    });
    expect(h.get("Content-Security-Policy")).toContain("manifest-src 'self'");
    expect(h.get("Content-Security-Policy")).toContain("worker-src 'self'");
    expect(h.get("X-Frame-Options")).toBe("DENY");
    expect(h.get("X-Content-Type-Options")).toBe("nosniff");
    expect(h.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(h.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
    expect(h.get("X-Permitted-Cross-Domain-Policies")).toBe("none");
    expect(h.get("Origin-Agent-Cluster")).toBe("?1");
    expect(h.get("X-DNS-Prefetch-Control")).toBe("off");
    expect(h.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(h.get("X-Request-Id")).toBe("req-test");
    expect(h.get("Cache-Control")).toMatch(/no-store/);
    expect(h.get("Permissions-Policy")).toContain("camera=()");
    expect(h.get("Referrer-Policy")).toBeTruthy();
  });
});
