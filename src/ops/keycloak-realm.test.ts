import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const realmPath = path.join(
  process.cwd(),
  "deploy/keycloak/realm-platform.json",
);

describe("Keycloak realm export (F4-04/06)", () => {
  it("esporta realm platform + client facilityflow-app (multi-app)", () => {
    expect(existsSync(realmPath)).toBe(true);
    const raw = readFileSync(realmPath, "utf8");
    const json = JSON.parse(raw) as {
      realm: string;
      clients: Array<{
        clientId: string;
        secret?: string;
        publicClient?: boolean;
        enabled?: boolean;
      }>;
    };
    expect(json.realm).toBe("platform");
    const app = json.clients.find((c) => c.clientId === "facilityflow-app");
    expect(app).toBeDefined();
    expect(app?.publicClient).toBe(false);
    expect(app?.secret).toMatch(/REPLACE/);
    expect(raw).toMatch(/api\/auth\/callback\/keycloak/);
    const sibling = json.clients.find(
      (c) => c.clientId === "example-sibling-app",
    );
    expect(sibling).toBeDefined();
    expect(sibling?.enabled).toBe(false);
    expect(existsSync(path.join(process.cwd(), "docs/ops/KEYCLOAK.md"))).toBe(
      true,
    );
    expect(
      existsSync(path.join(process.cwd(), "docs/ops/PLATFORM_IAM.md")),
    ).toBe(true);
  });

  it("auth.ts importa Keycloak provider e oidc-config", () => {
    const auth = readFileSync(path.join(process.cwd(), "src/auth.ts"), "utf8");
    expect(auth).toMatch(/next-auth\/providers\/keycloak/);
    expect(auth).toMatch(/isAuthOidcEnabled/);
    expect(auth).toMatch(/isAuthCredentialsEnabled/);
  });
});
