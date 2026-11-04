import { describe, expect, it } from "vitest";
import { OPEN_TICKET_STATUSES } from "@/domain/ticket/status";
import { listWallboardTickets } from "./wallboard-query";

describe("listWallboardTickets (characterization)", () => {
  it("exports OPEN vocabulary used by wallboard filter", () => {
    expect(OPEN_TICKET_STATUSES).toContain("open");
    expect(OPEN_TICKET_STATUSES).toContain("triaged");
    expect(OPEN_TICKET_STATUSES).toContain("waiting_parts");
  });

  it("rejects empty tenantId", async () => {
    await expect(listWallboardTickets("")).rejects.toThrow();
  });
});
