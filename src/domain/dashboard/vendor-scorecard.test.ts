import { TicketStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildSingleVendorScorecard,
  buildVendorScorecardRows,
  type VendorScorecardTicketSlice,
} from "./vendor-scorecard";

function t(
  partial: Partial<VendorScorecardTicketSlice> &
    Pick<VendorScorecardTicketSlice, "vendorId" | "vendorName" | "status">,
): VendorScorecardTicketSlice {
  const openedAt = partial.openedAt ?? new Date("2026-10-01T10:00:00Z");
  return {
    openedAt,
    verifiedAt: null,
    doneAt: null,
    slaDueAt: null,
    slaBreachedAt: null,
    actualCost: null,
    ...partial,
  };
}

describe("buildVendorScorecardRows", () => {
  const from = new Date("2026-10-01T00:00:00Z");

  it("aggrega chiusi, MTTR giorni, SLA hit, costi e aperti", () => {
    const opened = new Date("2026-10-10T08:00:00Z");
    const closed = new Date("2026-10-12T08:00:00Z"); // 2 giorni
    const tickets: VendorScorecardTicketSlice[] = [
      t({
        vendorId: "v1",
        vendorName: "Alpha Frigo",
        status: TicketStatus.verified,
        openedAt: opened,
        verifiedAt: closed,
        slaDueAt: new Date("2026-10-15T08:00:00Z"),
        actualCost: { toString: () => "100" },
      }),
      t({
        vendorId: "v1",
        vendorName: "Alpha Frigo",
        status: TicketStatus.done,
        openedAt: opened,
        doneAt: closed,
        slaDueAt: new Date("2026-10-11T08:00:00Z"),
        slaBreachedAt: new Date("2026-10-11T09:00:00Z"),
        actualCost: { toString: () => "50" },
      }),
      t({
        vendorId: "v1",
        vendorName: "Alpha Frigo",
        status: TicketStatus.in_progress,
      }),
      t({
        vendorId: "v2",
        vendorName: "Beta HVAC",
        status: TicketStatus.assigned,
      }),
    ];

    const rows = buildVendorScorecardRows({ tickets, from });
    expect(rows).toHaveLength(2);
    expect(rows[0]!.vendorName).toBe("Alpha Frigo");
    expect(rows[0]!.closedCount).toBe(2);
    expect(rows[0]!.avgResolutionDays).toBeCloseTo(2, 5);
    expect(rows[0]!.slaHitRate).toBe(0.5);
    expect(rows[0]!.costsTotal).toBe(150);
    expect(rows[0]!.openAssignedCount).toBe(1);
    expect(rows[1]!.vendorName).toBe("Beta HVAC");
    expect(rows[1]!.closedCount).toBe(0);
    expect(rows[1]!.openAssignedCount).toBe(1);
  });

  it("ignora chiusi fuori range; slaHitRate null senza slaDueAt", () => {
    const rows = buildVendorScorecardRows({
      from: new Date("2026-10-20T00:00:00Z"),
      tickets: [
        t({
          vendorId: "v1",
          vendorName: "Old",
          status: TicketStatus.done,
          doneAt: new Date("2026-10-05T00:00:00Z"),
          actualCost: { toString: () => "9" },
        }),
        t({
          vendorId: "v1",
          vendorName: "Old",
          status: TicketStatus.verified,
          verifiedAt: new Date("2026-10-21T00:00:00Z"),
          openedAt: new Date("2026-10-20T12:00:00Z"),
        }),
      ],
    });
    expect(rows[0]!.closedCount).toBe(1);
    expect(rows[0]!.costsTotal).toBe(0);
    expect(rows[0]!.slaHitRate).toBeNull();
  });

  it("buildSingleVendorScorecard filtra per id", () => {
    const rows = buildVendorScorecardRows({
      from,
      tickets: [
        t({
          vendorId: "a",
          vendorName: "A",
          status: TicketStatus.assigned,
        }),
      ],
    });
    expect(buildSingleVendorScorecard("a", rows)?.vendorId).toBe("a");
    expect(buildSingleVendorScorecard("missing", rows)).toBeNull();
  });
});
