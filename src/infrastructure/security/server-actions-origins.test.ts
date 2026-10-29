import { describe, expect, it } from "vitest";
import { resolveServerActionsAllowedOrigins } from "./server-actions-origins";

describe("resolveServerActionsAllowedOrigins", () => {
  it("preferisce env esplicita", () => {
    expect(
      resolveServerActionsAllowedOrigins({
        SERVER_ACTIONS_ALLOWED_ORIGINS: "proxy.example.com, https://cdn.example.com",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
      }),
    ).toEqual(["proxy.example.com", "cdn.example.com"]);
  });

  it("deriva da APP_URL / FF_DOMAIN ignorando localhost", () => {
    expect(
      resolveServerActionsAllowedOrigins({
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        FF_DOMAIN: "localhost",
      }),
    ).toEqual([]);
    expect(
      resolveServerActionsAllowedOrigins({
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
        FF_DOMAIN: "app.example.com",
      }),
    ).toEqual(["app.example.com"]);
  });
});
