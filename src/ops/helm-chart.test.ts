import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const chartRoot = path.join(process.cwd(), "deploy/helm/facilityflow");
const openbaoRoot = path.join(process.cwd(), "deploy/openbao");

describe("Helm chart facilityflow (F4-01…03)", () => {
  it("ha Chart.yaml, values e template app/worker/ingress/pdb/eso", () => {
    expect(existsSync(path.join(chartRoot, "Chart.yaml"))).toBe(true);
    expect(existsSync(path.join(chartRoot, "values.yaml"))).toBe(true);
    expect(existsSync(path.join(chartRoot, "values-staging.yaml"))).toBe(true);
    expect(existsSync(path.join(chartRoot, "values-prod.yaml"))).toBe(true);
    for (const f of [
      "templates/deployment-app.yaml",
      "templates/deployment-worker.yaml",
      "templates/service-app.yaml",
      "templates/ingress.yaml",
      "templates/pdb-app.yaml",
      "templates/pdb-worker.yaml",
      "templates/secretstore.yaml",
      "templates/externalsecret.yaml",
      "templates/serviceaccount-eso.yaml",
      "templates/_helpers.tpl",
    ]) {
      expect(existsSync(path.join(chartRoot, f))).toBe(true);
    }
  });

  it("values espongono vault/keycloak; vault+keycloak off di default", () => {
    const values = readFileSync(path.join(chartRoot, "values.yaml"), "utf8");
    expect(values).toMatch(/vault:\s*\n\s*enabled:\s*false/);
    expect(values).toMatch(/keycloak:\s*\n\s*enabled:\s*false/);
    expect(values).toMatch(/existingSecret:\s*facilityflow-runtime/);
    expect(values).toMatch(/podDisruptionBudget:\s*\n\s*enabled:\s*false/);
    expect(values).toMatch(/secretPath:\s*apps\/facilityflow\/runtime/);
  });

  it("staging/prod abilitano PDB + vault + keycloak; prod Credentials off", () => {
    const staging = readFileSync(
      path.join(chartRoot, "values-staging.yaml"),
      "utf8",
    );
    const prod = readFileSync(path.join(chartRoot, "values-prod.yaml"), "utf8");
    expect(staging).toMatch(/podDisruptionBudget:\s*\n\s*enabled:\s*true/);
    expect(prod).toMatch(/podDisruptionBudget:\s*\n\s*enabled:\s*true/);
    expect(prod).toMatch(/replicaCount:\s*2/);
    expect(staging).toMatch(/vault:\s*\n\s*enabled:\s*true/);
    expect(prod).toMatch(/vault:\s*\n\s*enabled:\s*true/);
    expect(staging).toMatch(/keycloak:\s*\n\s*enabled:\s*true/);
    expect(prod).toMatch(/keycloak:\s*\n\s*enabled:\s*true/);
    expect(prod).toMatch(/credentialsEnabled:\s*false/);
  });

  it("OpenBao values, policy e VAULT.md presenti", () => {
    expect(
      existsSync(path.join(openbaoRoot, "values-standalone.yaml")),
    ).toBe(true);
    expect(
      existsSync(path.join(openbaoRoot, "policies/facilityflow-eso.hcl")),
    ).toBe(true);
    expect(existsSync(path.join(process.cwd(), "docs/ops/VAULT.md"))).toBe(
      true,
    );
    expect(existsSync(path.join(process.cwd(), "docs/ops/KUBERNETES.md"))).toBe(
      true,
    );
    expect(
      existsSync(path.join(process.cwd(), "docs/adr/0010-k3s-helm-on-vps.md")),
    ).toBe(true);
    expect(
      existsSync(
        path.join(process.cwd(), "docs/adr/0011-keycloak-oidc-and-vault.md"),
      ),
    ).toBe(true);
  });
});
