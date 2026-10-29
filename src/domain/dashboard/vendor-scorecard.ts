import { TicketStatus } from "@prisma/client";

const OPEN_STATUSES: TicketStatus[] = [
  TicketStatus.open,
  TicketStatus.triaged,
  TicketStatus.assigned,
  TicketStatus.in_progress,
  TicketStatus.waiting_parts,
];

const CLOSED_STATUSES: TicketStatus[] = [
  TicketStatus.done,
  TicketStatus.verified,
];

export type VendorScorecardTicketSlice = {
  vendorId: string;
  vendorName: string;
  status: TicketStatus;
  openedAt: Date;
  verifiedAt: Date | null;
  doneAt: Date | null;
  slaDueAt: Date | null;
  slaBreachedAt: Date | null;
  actualCost: { toString(): string } | null;
};

export type VendorScorecardRow = {
  vendorId: string;
  vendorName: string;
  closedCount: number;
  /** Media giorni openedAt → chiusura (verifiedAt ?? doneAt) */
  avgResolutionDays: number | null;
  /** 0..1 tra chiusi con slaDueAt; null se nessuno */
  slaHitRate: number | null;
  costsTotal: number;
  openAssignedCount: number;
};

function closedAt(t: VendorScorecardTicketSlice): Date | null {
  if (!CLOSED_STATUSES.includes(t.status)) return null;
  return t.verifiedAt ?? t.doneAt;
}

/**
 * Aggrega KPI fornitori (F2-03) da slice Ticket già tenant-scoped.
 * Attribuzione: vendor corrente sul ticket (finale).
 */
export function buildVendorScorecardRows(input: {
  tickets: VendorScorecardTicketSlice[];
  from: Date;
}): VendorScorecardRow[] {
  type Acc = {
    vendorId: string;
    vendorName: string;
    closedCount: number;
    resolutionMsSum: number;
    slaWithDue: number;
    slaHit: number;
    costsTotal: number;
    openAssignedCount: number;
  };

  const map = new Map<string, Acc>();

  for (const t of input.tickets) {
    const cur = map.get(t.vendorId) ?? {
      vendorId: t.vendorId,
      vendorName: t.vendorName,
      closedCount: 0,
      resolutionMsSum: 0,
      slaWithDue: 0,
      slaHit: 0,
      costsTotal: 0,
      openAssignedCount: 0,
    };

    if (OPEN_STATUSES.includes(t.status)) {
      cur.openAssignedCount += 1;
    }

    const when = closedAt(t);
    if (when && when >= input.from) {
      cur.closedCount += 1;
      cur.resolutionMsSum += when.getTime() - t.openedAt.getTime();
      if (t.slaDueAt) {
        cur.slaWithDue += 1;
        if (!t.slaBreachedAt) cur.slaHit += 1;
      }
      if (t.actualCost != null) {
        cur.costsTotal += Number(t.actualCost);
      }
    }

    map.set(t.vendorId, cur);
  }

  return [...map.values()]
    .map((a) => ({
      vendorId: a.vendorId,
      vendorName: a.vendorName,
      closedCount: a.closedCount,
      avgResolutionDays:
        a.closedCount > 0
          ? a.resolutionMsSum / a.closedCount / (1000 * 60 * 60 * 24)
          : null,
      slaHitRate: a.slaWithDue > 0 ? a.slaHit / a.slaWithDue : null,
      costsTotal: a.costsTotal,
      openAssignedCount: a.openAssignedCount,
    }))
    .sort((a, b) => a.vendorName.localeCompare(b.vendorName, "it"));
}

export function buildSingleVendorScorecard(
  vendorId: string,
  rows: VendorScorecardRow[],
): VendorScorecardRow | null {
  return rows.find((r) => r.vendorId === vendorId) ?? null;
}
