import { Role, TicketStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  assertTransition,
  allowedNext,
  canCancel,
  canTransition,
  IllegalTransitionError,
} from "./fsm";

describe("ticket FSM (T2.1–T2.2)", () => {
  it("open → triaged allow HQ; deny store/vendor", () => {
    expect(
      canTransition(TicketStatus.open, TicketStatus.triaged, Role.ops_coordinator),
    ).toBe(true);
    expect(
      canTransition(TicketStatus.open, TicketStatus.triaged, Role.store_staff),
    ).toBe(false);
    expect(
      canTransition(TicketStatus.open, TicketStatus.triaged, Role.vendor),
    ).toBe(false);
  });

  it("open ↛ assigned diretto", () => {
    expect(
      canTransition(TicketStatus.open, TicketStatus.assigned, Role.owner),
    ).toBe(false);
    expect(() =>
      assertTransition(TicketStatus.open, TicketStatus.assigned, Role.admin_hq),
    ).toThrow(IllegalTransitionError);
  });

  it("done ↛ open; cancelled terminale", () => {
    expect(
      canTransition(TicketStatus.done, TicketStatus.open, Role.owner),
    ).toBe(false);
    expect(allowedNext(TicketStatus.cancelled, Role.owner)).toEqual([]);
    expect(
      canTransition(
        TicketStatus.cancelled,
        TicketStatus.open,
        Role.owner,
      ),
    ).toBe(false);
  });

  it("cancel solo HQ", () => {
    expect(canCancel(Role.owner)).toBe(true);
    expect(canCancel(Role.admin_hq)).toBe(true);
    expect(canCancel(Role.ops_coordinator)).toBe(true);
    expect(canCancel(Role.store_manager)).toBe(false);
    expect(canCancel(Role.vendor)).toBe(false);
    expect(
      canTransition(TicketStatus.open, TicketStatus.cancelled, Role.store_staff),
    ).toBe(false);
  });

  it("path fino ad assigned: open→triaged→assigned", () => {
    assertTransition(TicketStatus.open, TicketStatus.triaged, Role.ops_coordinator);
    assertTransition(
      TicketStatus.triaged,
      TicketStatus.assigned,
      Role.admin_hq,
    );
  });

  it("vendor non fa triage; può avanzare post-assigned", () => {
    expect(
      canTransition(TicketStatus.open, TicketStatus.triaged, Role.vendor),
    ).toBe(false);
    expect(
      canTransition(
        TicketStatus.assigned,
        TicketStatus.in_progress,
        Role.vendor,
      ),
    ).toBe(true);
    expect(
      canTransition(TicketStatus.assigned, TicketStatus.done, Role.vendor),
    ).toBe(true);
  });

  it("store verify da done; reject → in_progress; non triage", () => {
    expect(
      canTransition(TicketStatus.done, TicketStatus.verified, Role.store_manager),
    ).toBe(true);
    expect(
      canTransition(
        TicketStatus.done,
        TicketStatus.in_progress,
        Role.store_manager,
      ),
    ).toBe(true);
    expect(
      canTransition(TicketStatus.open, TicketStatus.triaged, Role.store_manager),
    ).toBe(false);
  });

  it("viewer_finance nessuna mutation FSM", () => {
    expect(allowedNext(TicketStatus.open, Role.viewer_finance)).toEqual([]);
    expect(
      canTransition(TicketStatus.done, TicketStatus.verified, Role.viewer_finance),
    ).toBe(false);
  });
});
