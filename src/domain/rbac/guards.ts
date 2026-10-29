import type { Role } from "@prisma/client";
import { can, canMutate } from "./can";
import type { RbacActionId } from "./actions";

export class ForbiddenError extends Error {
  constructor(message = "Operazione non consentita") {
    super(message);
    this.name = "ForbiddenError";
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
