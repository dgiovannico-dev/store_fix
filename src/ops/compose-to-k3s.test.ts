import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Compose→k3s runbook (F4-05)", () => {
  it("COMPOSE_TO_K3S.md copre backup, helm, smoke, DR", () => {
    const p = path.join(process.cwd(), "docs/ops/COMPOSE_TO_K3S.md");
    expect(existsSync(p)).toBe(true);
    const raw = readFileSync(p, "utf8");
    expect(raw).toMatch(/db:backup/);
    expect(raw).toMatch(/helm upgrade/);
    expect(raw).toMatch(/SMOKE_FLUSSO_A/);
    expect(raw).toMatch(/helm rollback|DR/i);
    expect(raw).toMatch(/VAULT\.md/);
    expect(raw).toMatch(/KEYCLOAK\.md/);
  });

  it("KUBERNETES e NEXT_VPS puntano al runbook F4-05", () => {
    const k8s = readFileSync(
      path.join(process.cwd(), "docs/ops/KUBERNETES.md"),
      "utf8",
    );
    const next = readFileSync(
      path.join(process.cwd(), "docs/ops/NEXT_VPS.md"),
      "utf8",
    );
    expect(k8s).toMatch(/COMPOSE_TO_K3S/);
    expect(next).toMatch(/COMPOSE_TO_K3S|KUBERNETES/);
  });
});
