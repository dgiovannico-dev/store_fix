import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Static gate: auth/intake actions use rate-limit-action helpers. */
describe("rate-limit-action wiring", () => {
  const root = process.cwd();

  it("login usa redirectIfRateLimited da rate-limit-redirect", () => {
    const raw = readFileSync(
      path.join(root, "src/app/actions/login.ts"),
      "utf8",
    );
    expect(raw).toMatch(/rate-limit-redirect/);
    expect(raw).toMatch(/redirectIfRateLimited/);
    expect(raw).toMatch(/RATE_LIMIT\.login/);
  });

  it("signup e createTicket usano rateLimitedRetryMessage", () => {
    const signup = readFileSync(
      path.join(root, "src/app/actions/signup.ts"),
      "utf8",
    );
    const tickets = readFileSync(
      path.join(root, "src/app/actions/tickets.ts"),
      "utf8",
    );
    expect(signup).toMatch(/rateLimitedRetryMessage/);
    expect(tickets).toMatch(/rateLimitedRetryMessage/);
  });
});
