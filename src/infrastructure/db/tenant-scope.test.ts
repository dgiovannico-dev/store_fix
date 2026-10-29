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
  });

  it("accetta tenantId e esclude soft-delete", () => {
    expect(tenantActiveWhere("tenant_1")).toEqual({
      tenantId: "tenant_1",
      deletedAt: null,
    });
  });
});
