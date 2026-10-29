import { describe, expect, it } from "vitest";
import { shouldUpgradeInsecureRequests } from "./csp-upgrade";

describe("shouldUpgradeInsecureRequests", () => {
  it("off in development", () => {
    expect(
      shouldUpgradeInsecureRequests({
        NODE_ENV: "development",
        FF_DOMAIN: "app.example.com",
      }),
    ).toBe(false);
  });

  it("off on local prod next start without domain", () => {
    expect(
      shouldUpgradeInsecureRequests({
        NODE_ENV: "production",
        FF_DOMAIN: "",
      }),
    ).toBe(false);
    expect(
      shouldUpgradeInsecureRequests({
        NODE_ENV: "production",
        FF_DOMAIN: "localhost",
      }),
    ).toBe(false);
  });

  it("on when prod + real FF_DOMAIN", () => {
    expect(
      shouldUpgradeInsecureRequests({
        NODE_ENV: "production",
        FF_DOMAIN: "ff.example.com",
      }),
    ).toBe(true);
  });

  it("rispetta override FF_CSP_UPGRADE_INSECURE", () => {
    expect(
      shouldUpgradeInsecureRequests({
        NODE_ENV: "development",
        FF_CSP_UPGRADE_INSECURE: "1",
      }),
    ).toBe(true);
    expect(
      shouldUpgradeInsecureRequests({
        NODE_ENV: "production",
        FF_DOMAIN: "ff.example.com",
        FF_CSP_UPGRADE_INSECURE: "0",
      }),
    ).toBe(false);
  });
});
