import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * US-E14-10 in-repo half: HSTS lives on Caddy (HTTPS), not Next middleware.
 * CI `verify:headers` hits HTTP app only — this gate locks the Caddyfile policy
 * without live TLS. Full HTTPS smoke remains VPS (`verify:headers https://…`).
 * @see docs/ops/SECURITY_HEADERS.md
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
 */
describe("deploy/Caddyfile HSTS policy", () => {
  const raw = readFileSync(
    path.join(process.cwd(), "deploy/Caddyfile"),
    "utf8",
  );

  /** Primary app site block (not s3.*). */
  function mainSiteHeaderBlock(source: string): string {
    const start = source.indexOf("{$FF_DOMAIN:localhost}");
    expect(start).toBeGreaterThanOrEqual(0);
    const s3 = source.indexOf("s3.{$FF_DOMAIN:localhost}", start + 1);
    const slice = s3 > start ? source.slice(start, s3) : source.slice(start);
    const headerMatch = slice.match(/header\s*\{([\s\S]*?)\}/);
    expect(headerMatch).toBeTruthy();
    return headerMatch![1]!;
  }

  it("imposta Strict-Transport-Security ≥ 1y con includeSubDomains", () => {
    const header = mainSiteHeaderBlock(raw);
    const hsts = header.match(
      /Strict-Transport-Security\s+"([^"]+)"/i,
    );
    expect(hsts).toBeTruthy();
    const value = hsts![1]!;
    expect(value).toMatch(/includeSubDomains/i);
    const age = value.match(/max-age=(\d+)/i);
    expect(age).toBeTruthy();
    expect(Number(age![1])).toBeGreaterThanOrEqual(31_536_000);
  });

  it("rimuove header Server nel blocco header primario", () => {
    const header = mainSiteHeaderBlock(raw);
    expect(header).toMatch(/^\s*-Server\b/m);
  });

  it("imposta X-DNS-Prefetch-Control off", () => {
    const header = mainSiteHeaderBlock(raw);
    expect(header).toMatch(/X-DNS-Prefetch-Control\s+"off"/i);
  });

  it("documenta trusted_proxies CDN (commentato)", () => {
    expect(raw).toMatch(/trusted_proxies\s+static/);
    expect(raw).toMatch(/trusted_proxies_strict/);
    expect(raw).toMatch(/FF_TRUSTED_PROXY_COUNT/);
  });
});
