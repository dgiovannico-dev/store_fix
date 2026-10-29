import { describe, expect, it } from "vitest";
import { renderEmailTemplate } from "./index";

describe("renderEmailTemplate", () => {
  it("renderizza i 5 template IT", () => {
    const ids = [
      "ticket_nuovo",
      "ticket_assign",
      "ticket_cancelled",
      "ticket_breach",
      "ticket_done",
      "ticket_verified",
      "ticket_rejected",
      "email_verify",
      "pm_reminder",
      "rfq_invite",
    ] as const;
    for (const id of ids) {
      const t = renderEmailTemplate(id, {
        ticketId: "T-1",
        storeName: "PV Milano",
        vendorName: "Frigo SpA",
        verifyUrl: "http://localhost/verify",
      });
      expect(t.subject).toContain("FacilityFlow");
      expect(t.text.length).toBeGreaterThan(10);
      if (id !== "email_verify" && id !== "pm_reminder" && id !== "rfq_invite") {
        expect(t.html).toContain("T-1");
      }
      if (id === "pm_reminder") {
        expect(t.html).toContain("PV Milano");
      }
      if (id === "rfq_invite") {
        expect(t.html).toContain("Frigo SpA");
      }
    }
  });
});
