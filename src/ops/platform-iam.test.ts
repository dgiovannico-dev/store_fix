import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Platform IAM multi-app (F4-06)", () => {
  it("OpenBao policies least-privilege su apps/<id>", () => {
    const policy = readFileSync(
      path.join(
        process.cwd(),
        "deploy/openbao/policies/facilityflow-eso.hcl",
      ),
      "utf8",
    );
    expect(policy).toMatch(/secret\/data\/apps\/facilityflow\/\*/);
    expect(policy).toMatch(/auth\/token\/lookup-self/);
    expect(policy).not.toMatch(/secret\/data\/\*/);
    expect(
      existsSync(
        path.join(process.cwd(), "deploy/openbao/policies/_template-app-eso.hcl"),
      ),
    ).toBe(true);
    expect(
      existsSync(path.join(process.cwd(), "scripts/platform-app-onboard.sh")),
    ).toBe(true);
    expect(
      existsSync(path.join(process.cwd(), "deploy/openbao/README.md")),
    ).toBe(true);
  });

  it("Helm secretPath usa apps/facilityflow/runtime", () => {
    const values = readFileSync(
      path.join(process.cwd(), "deploy/helm/facilityflow/values.yaml"),
      "utf8",
    );
    expect(values).toMatch(/secretPath:\s*apps\/facilityflow\/runtime/);
    expect(values).toMatch(/realms\/platform/);
  });

  it("ADR-0011 e PLATFORM_IAM documentano IdP/Vault condivisi", () => {
    const adr = readFileSync(
      path.join(process.cwd(), "docs/adr/0011-keycloak-oidc-and-vault.md"),
      "utf8",
    );
    const plat = readFileSync(
      path.join(process.cwd(), "docs/ops/PLATFORM_IAM.md"),
      "utf8",
    );
    expect(adr).toMatch(/shared platform|condivis/i);
    expect(adr).toMatch(/platform/);
    expect(plat).toMatch(/client per app/i);
    expect(plat).toMatch(/apps\/<app-id>/);
  });
});
