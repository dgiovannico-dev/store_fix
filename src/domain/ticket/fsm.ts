import { Role, TicketStatus } from "@prisma/client";

/**
 * FSM ticket — server-authoritative (T2.1 / US-E04-03).
 *
 * Matrice (to ← from):
 * | from \ to     | triaged | assigned | in_progress | waiting_parts | done | verified | cancelled |
 * |---------------|---------|----------|-------------|---------------|------|----------|-----------|
 * | open          | HQ      | —        | —           | —             | —    | —        | HQ        |
 * | triaged       | —       | HQ       | —           | —             | —    | —        | HQ        |
 * | assigned      | —       | —        | HQ|vendor   | HQ|vendor     | HQ|vendor | —     | HQ     |
 * | in_progress   | —       | —        | —           | HQ|vendor     | HQ|vendor | —     | HQ     |
 * | waiting_parts | —       | —        | HQ|vendor   | —             | HQ|vendor | —     | HQ     |
 * | done          | —       | —        | —           | —             | —    | store|HQ | HQ        |
 * | verified      | —       | —        | —           | —             | —    | —        | —         |
 * | cancelled     | —       | —        | —           | —             | —    | —        | —         |
 *
 * HQ = owner | admin_hq | ops_coordinator
 * store = store_manager | store_staff (scope store enforced altrove)
 * vendor = role vendor (solo ticket assegnati — enforced altrove)
 */

export class IllegalTransitionError extends Error {
  readonly code: "illegalTransition" | "illegalTransitionSame";

  constructor(
    public readonly from: TicketStatus,
    public readonly to: TicketStatus,
    public readonly role: Role,
    message?: string,
  ) {
    const code = from === to ? "illegalTransitionSame" : "illegalTransition";
    super(
      message ??
        `Transizione non consentita: ${from} → ${to} (ruolo ${role})`,
    );
    this.name = "IllegalTransitionError";
    this.code = code;
  }
}

const HQ: ReadonlySet<Role> = new Set([
  Role.owner,
  Role.admin_hq,
  Role.ops_coordinator,
]);

const STORE: ReadonlySet<Role> = new Set([
  Role.store_manager,
  Role.store_staff,
]);

const VENDOR: ReadonlySet<Role> = new Set([Role.vendor]);

type Edge = { to: TicketStatus; roles: ReadonlySet<Role> };

const EDGES: Record<TicketStatus, Edge[]> = {
  [TicketStatus.open]: [
    { to: TicketStatus.triaged, roles: HQ },
    { to: TicketStatus.cancelled, roles: HQ },
  ],
  [TicketStatus.triaged]: [
    { to: TicketStatus.assigned, roles: HQ },
    { to: TicketStatus.cancelled, roles: HQ },
  ],
  [TicketStatus.assigned]: [
    { to: TicketStatus.in_progress, roles: new Set([...HQ, ...VENDOR]) },
    { to: TicketStatus.waiting_parts, roles: new Set([...HQ, ...VENDOR]) },
    { to: TicketStatus.done, roles: new Set([...HQ, ...VENDOR]) },
    { to: TicketStatus.cancelled, roles: HQ },
  ],
  [TicketStatus.in_progress]: [
    { to: TicketStatus.waiting_parts, roles: new Set([...HQ, ...VENDOR]) },
    { to: TicketStatus.done, roles: new Set([...HQ, ...VENDOR]) },
    { to: TicketStatus.cancelled, roles: HQ },
  ],
  [TicketStatus.waiting_parts]: [
    { to: TicketStatus.in_progress, roles: new Set([...HQ, ...VENDOR]) },
    { to: TicketStatus.done, roles: new Set([...HQ, ...VENDOR]) },
    { to: TicketStatus.cancelled, roles: HQ },
  ],
  [TicketStatus.done]: [
    { to: TicketStatus.verified, roles: new Set([...HQ, ...STORE]) },
    // Reject S3: torna in lavorazione (US-E07-01)
    { to: TicketStatus.in_progress, roles: new Set([...HQ, ...STORE]) },
    { to: TicketStatus.cancelled, roles: HQ },
  ],
  [TicketStatus.verified]: [],
  [TicketStatus.cancelled]: [],
};

export function allowedNext(
  from: TicketStatus,
  role: Role,
): TicketStatus[] {
  return (EDGES[from] ?? [])
    .filter((e) => e.roles.has(role))
    .map((e) => e.to);
}

export function canTransition(
  from: TicketStatus,
  to: TicketStatus,
  role: Role,
): boolean {
  return allowedNext(from, role).includes(to);
}

export function assertTransition(
  from: TicketStatus,
  to: TicketStatus,
  role: Role,
): void {
  if (from === to) {
    throw new IllegalTransitionError(from, to, role, "Stato già corrente");
  }
  if (!canTransition(from, to, role)) {
    throw new IllegalTransitionError(from, to, role);
  }
}

/** Cancel: solo HQ (owner / admin_hq / ops_coordinator). */
export function canCancel(role: Role): boolean {
  return HQ.has(role);
}
