import { describe, expect, it } from "vitest";
import {
  evaluateApiCsrf,
  isCsrfExemptApiPath,
  parseAllowedHosts,
} from "./csrf-origin";

describe("isCsrfExemptApiPath", () => {
  it("esenta health, auth, inbound; protegge API app e /logout", () => {
    expect(isCsrfExemptApiPath("/api/health/ready")).toBe(true);
    expect(isCsrfExemptApiPath("/api/auth/callback/credentials")).toBe(true);
    expect(isCsrfExemptApiPath("/api/inbound/email")).toBe(true);
    expect(isCsrfExemptApiPath("/api/ai/suggest-category")).toBe(false);
    expect(isCsrfExemptApiPath("/app/tickets")).toBe(true);
    expect(isCsrfExemptApiPath("/logout")).toBe(false);
    expect(isCsrfExemptApiPath("/logout/")).toBe(false);
  });
});

describe("parseAllowedHosts", () => {
  it("accetta host e URL", () => {
    expect(parseAllowedHosts("app.example.com, https://lab.example.com:8443")).toEqual([
      "app.example.com",
      "lab.example.com:8443",
    ]);
  });
});

describe("evaluateApiCsrf", () => {
  const base = {
    method: "POST",
    pathname: "/api/ai/suggest-category",
    origin: null as string | null,
    secFetchSite: null as string | null,
    requestHost: "localhost:3000",
  };

  it("passa GET e path esenti", () => {
    expect(evaluateApiCsrf({ ...base, method: "GET" }).allow).toBe(true);
    expect(
      evaluateApiCsrf({
        ...base,
        pathname: "/api/inbound/email",
        secFetchSite: "cross-site",
      }).allow,
    ).toBe(true);
  });

  it("blocca Sec-Fetch-Site cross-site", () => {
    const r = evaluateApiCsrf({ ...base, secFetchSite: "cross-site" });
    expect(r.allow).toBe(false);
    if (!r.allow) expect(r.reason).toBe("sec-fetch-site-cross-site");
  });

  it("blocca Origin diverso dal Host", () => {
    const r = evaluateApiCsrf({
      ...base,
      origin: "https://evil.example",
      secFetchSite: "same-site",
    });
    expect(r.allow).toBe(false);
    if (!r.allow) expect(r.reason).toBe("origin-mismatch");
  });

  it("accetta Origin = Host", () => {
    expect(
      evaluateApiCsrf({
        ...base,
        origin: "http://localhost:3000",
        secFetchSite: "same-origin",
      }).allow,
    ).toBe(true);
  });

  it("accetta Origin via allowlist proxy", () => {
    expect(
      evaluateApiCsrf({
        ...base,
        requestHost: "app:3000",
        origin: "https://app.example.com",
        secFetchSite: "same-origin",
        allowedHosts: ["app.example.com"],
      }).allow,
    ).toBe(true);
  });

  it("passa senza Origin (curl)", () => {
    expect(evaluateApiCsrf({ ...base, origin: null }).allow).toBe(true);
  });

  it("protegge POST /logout da Origin mismatch", () => {
    const r = evaluateApiCsrf({
      ...base,
      pathname: "/logout",
      origin: "https://evil.example",
      secFetchSite: "cross-site",
    });
    expect(r.allow).toBe(false);
    if (!r.allow) expect(r.reason).toBe("sec-fetch-site-cross-site");
  });

  it("accetta POST /logout same-origin", () => {
    expect(
      evaluateApiCsrf({
        ...base,
        pathname: "/logout",
        origin: "http://localhost:3000",
        secFetchSite: "same-origin",
      }).allow,
    ).toBe(true);
  });
});