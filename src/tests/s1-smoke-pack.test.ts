/**
 * T1.34 — pacchetto smoke S1: RBAC deny/allow + isolation hooks.
 * Suite completa resta nei test di dominio; qui i gate critici in un file.
 */
import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { RbacAction } from "@/domain/rbac/actions";
import { can, canMutate } from "@/domain/rbac/can";
import { canAccessStore } from "@/domain/rbac/store-scope";

describe("S1 smoke RBAC pack", () => {
  it("invite / store / vendor / asset gates", () => {
    expect(canMutate(Role.owner, RbacAction.inviteUsers)).toBe(true);
    expect(canMutate(Role.store_staff, RbacAction.inviteUsers)).toBe(false);
    expect(canMutate(Role.admin_hq, RbacAction.crudStore)).toBe(true);
    expect(canMutate(Role.store_manager, RbacAction.crudVendor)).toBe(false);
    expect(can(Role.store_staff, RbacAction.crudAsset)).toBe(true);
    expect(canMutate(Role.viewer_finance, RbacAction.crudStore)).toBe(false);
  });

  it("membership store scope", () => {
    expect(
      canAccessStore(
        { role: Role.store_manager, storeIds: ["a"], deletedAt: null },
        "b",
      ),
    ).toBe(false);
    expect(
      canAccessStore(
        { role: Role.owner, storeIds: [], deletedAt: null },
        "any",
      ),
    ).toBe(true);
  });
});
