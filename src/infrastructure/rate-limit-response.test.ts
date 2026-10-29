import { describe, expect, it } from "vitest";
import { tooManyRequestsJson } from "./rate-limit-response";

describe("tooManyRequestsJson", () => {
  it("imposta 429, Retry-After e Cache-Control no-store", async () => {
    const res = tooManyRequestsJson("Troppe richieste", 42);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = await res.json();
    expect(body).toMatchObject({
      error: "Troppe richieste",
      code: "rate_limited",
      retryAfterSec: 42,
    });
  });
});
