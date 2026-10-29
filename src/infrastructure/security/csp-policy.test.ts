import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "./csp-policy";

describe("buildContentSecurityPolicy", () => {
  it("prod senza unsafe-eval; object-src e base-uri none", () => {
    const csp = buildContentSecurityPolicy({
      NODE_ENV: "production",
      FF_DOMAIN: "",
      FF_CSP_UPGRADE_INSECURE: "0",
    });
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("media-src 'none'");
    expect(csp).toContain("worker-src 'self'");
    expect(csp).not.toContain("worker-src 'self' blob:");
    expect(csp).toContain("manifest-src 'self'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("dev include unsafe-eval per HMR", () => {
    const csp = buildContentSecurityPolicy({
      NODE_ENV: "development",
      FF_CSP_UPGRADE_INSECURE: "0",
    });
    expect(csp).toContain("unsafe-eval");
  });

  it("upgrade-insecure con FF_DOMAIN reale in prod", () => {
    const csp = buildContentSecurityPolicy({
      NODE_ENV: "production",
      FF_DOMAIN: "app.example.com",
    });
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("forza upgrade con FF_CSP_UPGRADE_INSECURE=1", () => {
    const csp = buildContentSecurityPolicy({
      NODE_ENV: "development",
      FF_CSP_UPGRADE_INSECURE: "1",
    });
    expect(csp).toContain("upgrade-insecure-requests");
  });
});
