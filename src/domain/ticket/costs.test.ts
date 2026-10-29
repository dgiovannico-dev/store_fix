import { Role, TicketStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canReadTicketCosts, formatEur } from "./costs";
import { assertTicketMutable, TicketImmutableError } from "./mutability";
import { computeSlaBadge } from "@/domain/sla/badge";

describe("costs + mutability + sla badge", () => {
  it("viewer_finance solo done/verified", () => {
    expect(
      canReadTicketCosts(Role.viewer_finance, TicketStatus.open),
    ).toBe(false);
    expect(
      canReadTicketCosts(Role.viewer_finance, TicketStatus.verified),
    ).toBe(true);
  });

  it("store_staff non vede costi", () => {
    expect(
      canReadTicketCosts(Role.store_staff, TicketStatus.done),
    ).toBe(false);
  });

  it("formatEur IT", () => {
    expect(formatEur(12.5)).toContain("12");
  });

  it("verified immutabile", () => {
    expect(() => assertTicketMutable(TicketStatus.verified)).toThrow(
      TicketImmutableError,
    );
    expect(() => assertTicketMutable(TicketStatus.done)).not.toThrow();
  });

  it("badge breached / risk / ok", () => {
    const openedAt = new Date("2026-01-01T10:00:00Z");
    const due = new Date("2026-01-01T14:00:00Z");
    expect(
      computeSlaBadge({
        openedAt,
        slaDueAt: due,
        slaBreachedAt: new Date(),
      }).tone,
    ).toBe("breached");
    expect(
      computeSlaBadge({
        openedAt,
        slaDueAt: due,
        slaBreachedAt: null,
        now: new Date("2026-01-01T13:30:00Z"),
      }).tone,
    ).toBe("risk");
    expect(
      computeSlaBadge({
        openedAt,
        slaDueAt: due,
        slaBreachedAt: null,
        now: new Date("2026-01-01T11:00:00Z"),
      }).tone,
    ).toBe("ok");
  });
});
