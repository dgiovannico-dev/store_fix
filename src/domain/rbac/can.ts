import { Role } from "@prisma/client";
import { RbacAction, type Permission, type RbacActionId } from "./actions";

const A = "allow" as const;
const D = "deny" as const;
const S = "scoped" as const;

/**
 * Matrice sync con docs/product/RBAC.md (T1.17).
 * viewer_finance = read-only su costi/dashboard; deny su mutation rete.
 */
const MATRIX: Record<RbacActionId, Record<Role, Permission>> = {
  [RbacAction.manageTenant]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: D,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.inviteUsers]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: D,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.crudStore]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.membershipStore]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.crudVendor]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.crudVendorContract]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.managePmCalendar]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.crudSla]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.crudAsset]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: S,
    store_staff: S,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.openTicket]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: S,
    store_staff: S,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.triageTicket]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.vendorNote]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: S,
    viewer_finance: D,
  },
  [RbacAction.vendorStatus]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: S,
    viewer_finance: D,
  },
  [RbacAction.cancelTicket]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.verifyTicket]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: D,
    store_manager: S,
    store_staff: S,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.viewCosts]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: S,
    store_staff: D,
    vendor: S,
    viewer_finance: A,
  },
  [RbacAction.acceptQuote]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: D,
    store_manager: S,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.manageRfq]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.respondRfq]: {
    owner: D,
    admin_hq: D,
    ops_coordinator: D,
    store_manager: D,
    store_staff: D,
    vendor: S,
    viewer_finance: D,
  },
  [RbacAction.dashboardHq]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: A,
  },
  [RbacAction.exportGdpr]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: D,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.viewConfigAudit]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: D,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: D,
  },
  [RbacAction.exportAccounting]: {
    owner: A,
    admin_hq: A,
    ops_coordinator: A,
    store_manager: D,
    store_staff: D,
    vendor: D,
    viewer_finance: A,
  },
};

export function permissionFor(role: Role, action: RbacActionId): Permission {
  return MATRIX[action][role];
}

/** true se allow o scoped (scope enforced altrove, es. T1.27). */
export function can(role: Role, action: RbacActionId): boolean {
  const p = permissionFor(role, action);
  return p === "allow" || p === "scoped";
}

export function canMutate(role: Role, action: RbacActionId): boolean {
  return permissionFor(role, action) === "allow";
}
