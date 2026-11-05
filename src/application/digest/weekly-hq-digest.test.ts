import { describe, expect, it } from "vitest";
import { digestWeekKey } from "./week-key";
import { renderEmailTemplate } from "@/infrastructure/email/templates";

describe("F9-01 digest week key + hq_digest template", () => {
  it("digestWeekKey is YYYY-MM-DD Monday", () => {
    const key = digestWeekKey(new Date("2026-11-05T12:00:00Z")); // Thursday
    expect(key).toBe("2026-11-02");
  });

  it("hq_digest HTML includes ticket href and ack", () => {
    const href = "http://localhost:3000/app/tickets/cm_ticket_1";
    const t = renderEmailTemplate(
      "hq_digest",
      {
        storeName: "Demo",
        summary: href,
        summaryHtml: `<ul><li><a href="${href}">PV — frigo…</a></li></ul>`,
        ackUrl: "http://localhost:3000/app/dashboard?digestAck=2026-11-02",
      },
      "it",
    );
    expect(t.html).toContain(href);
    expect(t.html).toContain("Segna rivisto");
    expect(t.subject).toContain("Digest");
  });
});
