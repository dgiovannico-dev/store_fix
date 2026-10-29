/** Azioni S1 allineate a docs/product/RBAC.md */
export const RbacAction = {
  manageTenant: "manage_tenant",
  inviteUsers: "invite_users",
  crudStore: "crud_store",
  membershipStore: "membership_store",
  crudVendor: "crud_vendor",
  /** Contratti fornitore (F2-04 v1) */
  crudVendorContract: "crud_vendor_contract",
  /** Calendario PM (F2-04 v2) */
  managePmCalendar: "manage_pm_calendar",
  crudSla: "crud_sla",
  crudAsset: "crud_asset",
  openTicket: "open_ticket",
  triageTicket: "triage_ticket",
  vendorNote: "vendor_note",
  vendorStatus: "vendor_status",
  cancelTicket: "cancel_ticket",
  verifyTicket: "verify_ticket",
  viewCosts: "view_costs",
  /** Accetta/rifiuta preventivo (F2-02) */
  acceptQuote: "accept_quote",
  dashboardHq: "dashboard_hq",
  exportGdpr: "export_gdpr",
  viewConfigAudit: "view_config_audit",
  exportAccounting: "export_accounting",
} as const;

export type RbacActionId = (typeof RbacAction)[keyof typeof RbacAction];

export type Permission = "allow" | "deny" | "scoped";
