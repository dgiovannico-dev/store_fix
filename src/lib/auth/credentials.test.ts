import { describe, expect, it } from "vitest";
import { credentialsSchema } from "./credentials";

describe("credentialsSchema", () => {
  it("accetta email/password valide", () => {
    const r = credentialsSchema.safeParse({
      email: "owner@demo.facilityflow.local",
      password: "DemoOwner123!",
    });
    expect(r.success).toBe(true);
  });

  it("rifiuta password corta", () => {
    const r = credentialsSchema.safeParse({
      email: "a@b.co",
      password: "short",
    });
    expect(r.success).toBe(false);
  });
});
