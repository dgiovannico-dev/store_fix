import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { assertCan, ForbiddenError } from "./guards";
import { RbacAction } from "./actions";

describe("ForbiddenError", () => {
  it("default: code forbidden, diagnostic EN", () => {
    const e = new ForbiddenError();
    expect(e.code).toBe("forbidden");
    expect(e.message).toMatch(/Forbidden/);
    expect(e.message).not.toMatch(/consentita/i);
  });

  it("code-first senza copy IT", () => {
    const e = new ForbiddenError(undefined, "storeOutOfScope");
    expect(e.code).toBe("storeOutOfScope");
    expect(e.message).toContain("storeOutOfScope");
  });
});

describe("assertCan", () => {
  it("store_staff denied su manageTenant", () => {
    expect(() =>
      assertCan(Role.store_staff, RbacAction.manageTenant),
    ).toThrow(ForbiddenError);
    try {
      assertCan(Role.store_staff, RbacAction.manageTenant);
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenError);
      if (e instanceof ForbiddenError) expect(e.code).toBe("forbidden");
    }
  });
});
