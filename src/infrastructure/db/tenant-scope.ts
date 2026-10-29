/**
 * Fail-closed tenancy: ogni query data-layer deve passare da qui (T1.15).
 * `code` → catalogo UI; `message` diagnostica EN (log/test).
 */
export class TenantRequiredError extends Error {
  readonly code = "tenantIdRequired" as const;

  constructor() {
    super("tenantId is required");
    this.name = "TenantRequiredError";
  }
}

export function requireTenantId(
  tenantId: string | null | undefined,
): asserts tenantId is string {
  if (!tenantId || typeof tenantId !== "string" || !tenantId.trim()) {
    throw new TenantRequiredError();
  }
}

/** Where clause base: tenant + non soft-deleted. */
export function tenantActiveWhere(tenantId: string | null | undefined) {
  requireTenantId(tenantId);
  return { tenantId, deletedAt: null as Date | null };
}
