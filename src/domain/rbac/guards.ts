import type { Role } from "@prisma/client";
import { can, canMutate } from "./can";
import type { RbacActionId } from "./actions";

/**
 * RBAC denial. Prefer `code` (domainErrors); `message` is EN diagnostic for logs.
 * UI localizes via `actionResultError` / `domainError(code)`.
 */
export class ForbiddenError extends Error {
  readonly code: string;

  constructor(message?: string, code?: string) {
    const resolvedCode = code ?? "forbidden";
    // Diagnostic EN (or explicit message); never default IT user copy
    super(message ?? `Forbidden (${resolvedCode})`);
    this.name = "ForbiddenError";
    this.code = resolvedCode;
  }
}

export function assertCan(role: Role | undefined | null, action: RbacActionId): void {
  if (!role || !can(role, action)) {
    throw new ForbiddenError();
  }
}

/** Solo allow stretto (no scoped) — per invite HQ / CRUD vendor S1. */
export function assertCanMutate(
  role: Role | undefined | null,
  action: RbacActionId,
): void {
  if (!role || !canMutate(role, action)) {
    throw new ForbiddenError();
  }
}
