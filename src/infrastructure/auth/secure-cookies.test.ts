import { describe, expect, it } from "vitest";
import {
  sessionTokenCookie,
  shouldUseSecureAuthCookies,
} from "./secure-cookies";

describe("shouldUseSecureAuthCookies", () => {
  it("off su lab HTTP anche in production", () => {
    expect(
      shouldUseSecureAuthCookies({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        FF_DOMAIN: "localhost",
      }),
    ).toBe(false);
  });

  it("on con NEXT_PUBLIC_APP_URL https", () => {
    expect(
      shouldUseSecureAuthCookies({
        NODE_ENV: "development",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
      }),
    ).toBe(true);
  });

  it("on con AUTH_URL https", () => {
    expect(
      shouldUseSecureAuthCookies({
        AUTH_URL: "https://app.example.com",
      }),
    ).toBe(true);
  });

  it("on in prod con FF_DOMAIN reale", () => {
    expect(
      shouldUseSecureAuthCookies({
        NODE_ENV: "production",
        FF_DOMAIN: "app.example.com",
      }),
    ).toBe(true);
  });

  it("rispetta AUTH_SECURE_COOKIES override", () => {
    expect(
      shouldUseSecureAuthCookies({
        AUTH_SECURE_COOKIES: "1",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
    ).toBe(true);
    expect(
      shouldUseSecureAuthCookies({
        AUTH_SECURE_COOKIES: "0",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
      }),
    ).toBe(false);
  });
});

describe("sessionTokenCookie", () => {
  it("prefissa __Secure- quando secure", () => {
    const c = sessionTokenCookie(true);
    expect(c.name).toBe("__Secure-authjs.session-token");
    expect(c.options.secure).toBe(true);
    expect(c.options.httpOnly).toBe(true);
    expect(c.options.sameSite).toBe("lax");
  });

  it("nome plain su HTTP lab", () => {
    const c = sessionTokenCookie(false);
    expect(c.name).toBe("authjs.session-token");
    expect(c.options.secure).toBe(false);
  });
});
