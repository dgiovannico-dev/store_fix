import { describe, expect, it } from "vitest";
import { it as itCatalog } from "@/i18n/it";
import { ticketEventLabel } from "./event-labels";

describe("ticketEventLabel", () => {
  const labels = itCatalog.ticketTimeline;

  it("mappa eventi noti inclusa retention GDPR", () => {
    expect(ticketEventLabel(labels, "ticket.created")).toBe(labels.evtCreated);
    expect(ticketEventLabel(labels, "gdpr_retention_purge")).toBe(
      labels.evtGdprPurge,
    );
  });

  it("fallback al raw type se sconosciuto", () => {
    expect(ticketEventLabel(labels, "custom.event")).toBe("custom.event");
  });
});
