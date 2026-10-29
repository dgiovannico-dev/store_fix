import { describe, expect, it } from "vitest";
import {
  requireTenantId,
  tenantActiveWhere,
  TenantRequiredError,
} from "./tenant-scope";

describe("tenant-scope", () => {
  it("fail-closed senza tenantId", () => {
    expect(() => requireTenantId(undefined)).toThrow(TenantRequiredError);
    expect(() => requireTenantId("")).toThrow(TenantRequiredError);
    expect(() => tenantActiveWhere(null)).toThrow(TenantRequiredError);
    try {
      requireTenantId(null);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(TenantRequiredError);
      expect((e as TenantRequiredError).code).toBe("tenantIdRequired");
      expect((e as TenantRequiredError).message).toBe("tenantId is required");
      expect((e as TenantRequiredError).message).not.toMatch(/obbligatorio/i);
    }
  });

  it("accetta tenantId e esclude soft-delete", () => {
    expect(tenantActiveWhere("tenant_1")).toEqual({
      tenantId: "tenant_1",
      deletedAt: null,
    });
  });
});
