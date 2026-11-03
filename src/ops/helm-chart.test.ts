import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const chartRoot = path.join(process.cwd(), "deploy/helm/facilityflow");

describe("Helm chart facilityflow (F4-01)", () => {
  it("ha Chart.yaml, values e template app/worker/ingress", () => {
    expect(existsSync(path.join(chartRoot, "Chart.yaml"))).toBe(true);
    expect(existsSync(path.join(chartRoot, "values.yaml"))).toBe(true);
    for (const f of [
      "templates/deployment-app.yaml",
      "templates/deployment-worker.yaml",
      "templates/service-app.yaml",
      "templates/ingress.yaml",
      "templates/_helpers.tpl",
    ]) {
      expect(existsSync(path.join(chartRoot, f))).toBe(true);
    }
  });

  it("values espongono vault/keycloak disabilitati di default", () => {
    const values = readFileSync(path.join(chartRoot, "values.yaml"), "utf8");
    expect(values).toMatch(/vault:\s*\n\s*enabled:\s*false/);
    expect(values).toMatch(/keycloak:\s*\n\s*enabled:\s*false/);
    expect(values).toMatch(/existingSecret:\s*facilityflow-runtime/);
  });

  it("docs e ADR F4 presenti", () => {
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
