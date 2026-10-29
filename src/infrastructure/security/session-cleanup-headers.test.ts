import { describe, expect, it } from "vitest";
import {
  applyLogoutClearSiteData,
  applyNoStore,
  CACHE_CONTROL_NO_STORE,
  CLEAR_SITE_DATA_ON_LOGOUT,
  isAuthJsSignOutPath,
} from "./session-cleanup-headers";

describe("session-cleanup-headers", () => {
  it("applies Cache-Control no-store", () => {
    const h = new Headers();
    applyNoStore(h);
    expect(h.get("Cache-Control")).toBe(CACHE_CONTROL_NO_STORE);
  });

  it("applies Clear-Site-Data with quoted directives + no-store", () => {
    const h = new Headers();
    applyLogoutClearSiteData(h);
    expect(h.get("Clear-Site-Data")).toBe(CLEAR_SITE_DATA_ON_LOGOUT);
    expect(h.get("Cache-Control")).toBe(CACHE_CONTROL_NO_STORE);
    expect(CLEAR_SITE_DATA_ON_LOGOUT).toMatch(/"cache"/);
    expect(CLEAR_SITE_DATA_ON_LOGOUT).toMatch(/"cookies"/);
    expect(CLEAR_SITE_DATA_ON_LOGOUT).toMatch(/"storage"/);
  });

  it("detects Auth.js signout paths", () => {
    expect(isAuthJsSignOutPath("/api/auth/signout")).toBe(true);
    expect(isAuthJsSignOutPath("/api/auth/signout/")).toBe(true);
    expect(isAuthJsSignOutPath("/api/auth/session")).toBe(false);
    expect(isAuthJsSignOutPath("/logout")).toBe(false);
  });
});
