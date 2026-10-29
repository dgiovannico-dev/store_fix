import type { Role } from "@prisma/client";
import { can, canMutate } from "./can";
import type { RbacActionId } from "./actions";

export class ForbiddenError extends Error {
  /** Codice catalogo `domainErrors` — assente se messaggio legacy custom. */
  readonly code?: string;

  constructor(message?: string, code?: string) {
    const msg = message ?? "Operazione non consentita";
    super(msg);
    this.name = "ForbiddenError";
    // Default senza messaggio → code generico; custom string resta legacy finché migrata
    this.code = code ?? (message === undefined ? "forbidden" : undefined);
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
