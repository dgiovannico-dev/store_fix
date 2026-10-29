import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { RbacAction } from "./actions";
import { can, canMutate, permissionFor } from "./can";

describe("RBAC can()", () => {
  it("admin_hq può CRUD store; store_staff no", () => {
    expect(can(Role.admin_hq, RbacAction.crudStore)).toBe(true);
    expect(can(Role.store_staff, RbacAction.crudStore)).toBe(false);
  });

  it("store_staff non invita; owner sì", () => {
    expect(can(Role.store_staff, RbacAction.inviteUsers)).toBe(false);
    expect(can(Role.owner, RbacAction.inviteUsers)).toBe(true);
  });

  it("viewer_finance read-only su rete", () => {
    expect(can(Role.viewer_finance, RbacAction.dashboardHq)).toBe(true);
    expect(canMutate(Role.viewer_finance, RbacAction.crudStore)).toBe(false);
    expect(canMutate(Role.viewer_finance, RbacAction.inviteUsers)).toBe(false);
    expect(permissionFor(Role.viewer_finance, RbacAction.viewCosts)).toBe("allow");
    expect(can(Role.viewer_finance, RbacAction.viewConfigAudit)).toBe(false);
    expect(can(Role.owner, RbacAction.viewConfigAudit)).toBe(true);
    expect(can(Role.viewer_finance, RbacAction.exportAccounting)).toBe(true);
    expect(can(Role.store_staff, RbacAction.exportAccounting)).toBe(false);
  });

  it("store_manager scoped su asset, deny su vendor CRUD", () => {
    expect(permissionFor(Role.store_manager, RbacAction.crudAsset)).toBe("scoped");
    expect(can(Role.store_manager, RbacAction.crudVendor)).toBe(false);
  });

  it("acceptQuote: store_manager scoped, vendor deny", () => {
    expect(permissionFor(Role.store_manager, RbacAction.acceptQuote)).toBe(
      "scoped",
    );
    expect(can(Role.vendor, RbacAction.acceptQuote)).toBe(false);
    expect(can(Role.owner, RbacAction.acceptQuote)).toBe(true);
  });

  it("RFQ: ops manage, vendor respond scoped", () => {
    expect(can(Role.ops_coordinator, RbacAction.manageRfq)).toBe(true);
    expect(canMutate(Role.ops_coordinator, RbacAction.manageRfq)).toBe(true);
    expect(can(Role.vendor, RbacAction.respondRfq)).toBe(true);
    expect(canMutate(Role.vendor, RbacAction.respondRfq)).toBe(false);
    expect(can(Role.store_staff, RbacAction.manageRfq)).toBe(false);
  });
});
