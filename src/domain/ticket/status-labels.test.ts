import { TicketStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { ticketStatusLabel } from "./status-labels";

describe("ticketStatusLabel", () => {
  it("mappa stati noti IT/EN e fallback raw", () => {
    expect(ticketStatusLabel(TicketStatus.open)).toMatch(/Aperto/i);
    expect(ticketStatusLabel(TicketStatus.in_progress, "en")).toMatch(
      /In progress/i,
    );
    expect(ticketStatusLabel(TicketStatus.waiting_parts, "it")).toMatch(
      /pezzi/i,
    );
    expect(ticketStatusLabel("legacy_xyz")).toBe("legacy_xyz");
  });
});
