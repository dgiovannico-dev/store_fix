import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Lab compose must not publish ports on all interfaces.
 * @see https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/
 */
describe("docker-compose.yml loopback ports", () => {
  const raw = readFileSync(
    path.join(process.cwd(), "docker-compose.yml"),
    "utf8",
  );

  it("non usa bind bare HOST:CONTAINER senza 127.0.0.1", () => {
    // Matches "5432:5432" / "3000:3000" but not "127.0.0.1:5432:5432"
    const bare = raw.match(/^\s*-\s*["']?\d+:\d+["']?\s*$/gm) ?? [];
    expect(bare).toEqual([]);
  });

  it("postgres / seaweed / app / mailpit su loopback", () => {
    expect(raw).toMatch(/127\.0\.0\.1:5432:5432/);
    expect(raw).toMatch(/127\.0\.0\.1:8333:8333/);
    expect(raw).toMatch(/127\.0\.0\.1:3000:3000/);
    expect(raw).toMatch(/127\.0\.0\.1:8025:8025/);
  });

  it("app e worker hanno no-new-privileges", () => {
    expect(raw).toMatch(/no-new-privileges:true/);
  });
});

describe("compose.prod.yaml hardening", () => {
  const raw = readFileSync(
    path.join(process.cwd(), "compose.prod.yaml"),
    "utf8",
  );

  it("app/worker/caddy hanno no-new-privileges", () => {
    expect(raw).toMatch(/no-new-privileges:true/);
    const hits = raw.match(/no-new-privileges:true/g) ?? [];
    expect(hits.length).toBeGreaterThanOrEqual(3);
  });

  it("app espone solo loopback 3000", () => {
    expect(raw).toMatch(/127\.0\.0\.1:3000:3000/);
  });

  it("seaweedfs usa cluster/healthz e app attende healthy", () => {
    expect(raw).toMatch(/cluster\/healthz/);
    expect(raw).toMatch(
      /seaweedfs:[\s\S]*?condition:\s*service_healthy/,
    );
  });
});

describe("docker-compose.yml seaweedfs health", () => {
  const raw = readFileSync(
    path.join(process.cwd(), "docker-compose.yml"),
    "utf8",
  );

  it("healthcheck master healthz + app depends_on healthy", () => {
    expect(raw).toMatch(/cluster\/healthz/);
    expect(raw).toMatch(
      /seaweedfs:[\s\S]*?condition:\s*service_healthy/,
    );
  });

  it("pinna seaweedfs a tag+digest (lab e prod)", () => {
    const pin =
      /chrislusf\/seaweedfs:3\.\d+@sha256:[a-f0-9]{64}/;
    expect(raw).toMatch(pin);
    const prod = readFileSync(
      path.join(process.cwd(), "compose.prod.yaml"),
      "utf8",
    );
    expect(prod).toMatch(pin);
  });
});

describe("docker-compose.yml mailpit health", () => {
  const raw = readFileSync(
    path.join(process.cwd(), "docker-compose.yml"),
    "utf8",
  );

  it("usa /mailpit readyz e app/worker attendono healthy", () => {
    expect(raw).toMatch(/\/mailpit["']?\s*,\s*["']?readyz/);
    expect(raw).toMatch(/mailpit:[\s\S]*?condition:\s*service_healthy/);
  });

  it("pinna mailpit a tag semver (no :latest)", () => {
    expect(raw).toMatch(/axllent\/mailpit:v\d+\.\d+\.\d+/);
    expect(raw).not.toMatch(/axllent\/mailpit:latest/);
  });
});

describe("observe valkey health", () => {
  it("lab e prod pinano valkey + ping healthcheck", () => {
    for (const file of ["docker-compose.yml", "compose.prod.yaml"]) {
      const raw = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(raw).toMatch(/valkey\/valkey:8\.1\.11-alpine/);
      expect(raw).toMatch(/valkey-cli["']?\s*,\s*["']?ping/);
      expect(raw).toMatch(
        /glitchtip-valkey:[\s\S]*?condition:\s*service_healthy/,
      );
    }
  });
});

describe("worker seaweed wiring", () => {
  it("lab e prod: worker depends_on seaweed healthy", () => {
    for (const file of ["docker-compose.yml", "compose.prod.yaml"]) {
      const raw = readFileSync(path.join(process.cwd(), file), "utf8");
      const worker = raw.split(/\n  worker:\n/)[1] ?? "";
      expect(worker).toMatch(/seaweedfs:[\s\S]*?condition:\s*service_healthy/);
      expect(worker).toMatch(/S3_ENDPOINT:/);
    }
  });
});

describe("pinned base images", () => {
  it("postgres e caddy usano tag patch (no floating major-only alpine)", () => {
    const lab = readFileSync(
      path.join(process.cwd(), "docker-compose.yml"),
      "utf8",
    );
    const prod = readFileSync(
      path.join(process.cwd(), "compose.prod.yaml"),
      "utf8",
    );
    expect(lab).toMatch(/postgres:16\.\d+-alpine/);
    expect(lab).not.toMatch(/postgres:16-alpine/);
    expect(prod).toMatch(/postgres:16\.\d+-alpine/);
    expect(prod).not.toMatch(/postgres:16-alpine/);
    expect(prod).toMatch(/caddy:2\.9\.\d+-alpine/);
    expect(prod).not.toMatch(/caddy:2\.9-alpine[^\d]/);
  });

  it("infra images usano tag@sha256 (lab+prod)", () => {
    const digest = /@sha256:[a-f0-9]{64}/;
    const lab = readFileSync(
      path.join(process.cwd(), "docker-compose.yml"),
      "utf8",
    );
    const prod = readFileSync(
      path.join(process.cwd(), "compose.prod.yaml"),
      "utf8",
    );
    for (const raw of [lab, prod]) {
      expect(raw).toMatch(new RegExp(`postgres:16\\.\\d+-alpine${digest.source}`));
      expect(raw).toMatch(
        new RegExp(`valkey/valkey:8\\.\\d+\\.\\d+-alpine${digest.source}`),
      );
    }
    expect(lab).toMatch(
      new RegExp(`axllent/mailpit:v\\d+\\.\\d+\\.\\d+${digest.source}`),
    );
    expect(prod).toMatch(
      new RegExp(`caddy:2\\.\\d+\\.\\d+-alpine${digest.source}`),
    );
  });

  it("lab e prod condividono digest per immagini condivise", () => {
    const lab = readFileSync(
      path.join(process.cwd(), "docker-compose.yml"),
      "utf8",
    );
    const prod = readFileSync(
      path.join(process.cwd(), "compose.prod.yaml"),
      "utf8",
    );
    const pin = (raw: string, re: RegExp) => {
      const m = raw.match(re);
      expect(m?.[0]).toBeTruthy();
      return m![0];
    };
    expect(
      pin(lab, /postgres:16\.\d+-alpine@sha256:[a-f0-9]{64}/),
    ).toBe(pin(prod, /postgres:16\.\d+-alpine@sha256:[a-f0-9]{64}/));
    expect(
      pin(lab, /chrislusf\/seaweedfs:3\.\d+@sha256:[a-f0-9]{64}/),
    ).toBe(pin(prod, /chrislusf\/seaweedfs:3\.\d+@sha256:[a-f0-9]{64}/));
    expect(
      pin(lab, /valkey\/valkey:8\.\d+\.\d+-alpine@sha256:[a-f0-9]{64}/),
    ).toBe(pin(prod, /valkey\/valkey:8\.\d+\.\d+-alpine@sha256:[a-f0-9]{64}/));
  });
});

describe("dependabot supply-chain", () => {
  it("abilita npm + docker + docker-compose + github-actions su develop", () => {
    const raw = readFileSync(
      path.join(process.cwd(), ".github/dependabot.yml"),
      "utf8",
    );
    expect(raw).toMatch(/package-ecosystem:\s*npm/);
    expect(raw).toMatch(/package-ecosystem:\s*docker\b/);
    expect(raw).toMatch(/package-ecosystem:\s*docker-compose/);
    expect(raw).toMatch(/package-ecosystem:\s*github-actions/);
    expect(raw).toMatch(/target-branch:\s*develop/);
    expect(raw).toMatch(/version-update:semver-major/);
  });
});

describe("CI Actions SHA pin", () => {
  it("checkout e setup-node usano commit SHA (no floating @vN)", () => {
    const raw = readFileSync(
      path.join(process.cwd(), ".github/workflows/ci.yml"),
      "utf8",
    );
    expect(raw).toMatch(
      /uses:\s*actions\/checkout@[0-9a-f]{40}\s+#\s*v\d+/,
    );
    expect(raw).toMatch(
      /uses:\s*actions\/setup-node@[0-9a-f]{40}\s+#\s*v\d+/,
    );
    expect(raw).not.toMatch(/uses:\s*actions\/checkout@v\d+\s*$/m);
    expect(raw).not.toMatch(/uses:\s*actions\/setup-node@v\d+\s*$/m);
  });
});






