import { describe, expect, it } from "vitest";
import {
  isAuthCredentialsEnabled,
  isAuthOidcEnabled,
  keycloakProviderOptions,
} from "./oidc-config";

const fullOidc = {
  AUTH_OIDC_ENABLED: "1",
  AUTH_KEYCLOAK_ID: "facilityflow-app",
  AUTH_KEYCLOAK_SECRET: "s3cret",
  AUTH_KEYCLOAK_ISSUER: "https://auth.example/realms/facilityflow",
};

describe("oidc-config (F4-04)", () => {
  it("OIDC off senza flag o senza client env", () => {
    expect(isAuthOidcEnabled({})).toBe(false);
    expect(isAuthOidcEnabled({ AUTH_OIDC_ENABLED: "1" })).toBe(false);
    expect(
      isAuthOidcEnabled({
        AUTH_OIDC_ENABLED: "1",
        AUTH_KEYCLOAK_ID: "x",
        AUTH_KEYCLOAK_SECRET: "y",
        // missing issuer
      }),
    ).toBe(false);
  });

  it("OIDC on con flag + ID/SECRET/ISSUER", () => {
    expect(isAuthOidcEnabled(fullOidc)).toBe(true);
  });

  it("Credentials default on; off quando OIDC on; override espliciti", () => {
    expect(isAuthCredentialsEnabled({})).toBe(true);
    expect(isAuthCredentialsEnabled(fullOidc)).toBe(false);
    expect(
      isAuthCredentialsEnabled({
        ...fullOidc,
        AUTH_CREDENTIALS_ENABLED: "1",
      }),
    ).toBe(true);
    expect(
      isAuthCredentialsEnabled({ AUTH_CREDENTIALS_ENABLED: "0" }),
    ).toBe(false);
  });

  it("keycloakProviderOptions normalizza issuer trailing slash", () => {
    const opts = keycloakProviderOptions({
      ...fullOidc,
      AUTH_KEYCLOAK_ISSUER: "https://auth.example/realms/facilityflow/",
    });
    expect(opts.issuer).toBe("https://auth.example/realms/facilityflow");
    expect(opts.clientId).toBe("facilityflow-app");
  });
});
