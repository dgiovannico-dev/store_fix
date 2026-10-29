import { describe, expect, it } from "vitest";
import { renderEmailTemplate } from "./index";

const IDS = [
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
  "invite",
  "password_reset",
] as const;

describe("renderEmailTemplate", () => {
  it("renderizza tutti i template IT", () => {
    for (const id of IDS) {
      const t = renderEmailTemplate(
        id,
        {
          ticketId: "T-1",
          storeName: "PV Milano",
          vendorName: "Frigo SpA",
          verifyUrl: "http://localhost/verify",
          acceptUrl: "http://localhost/invite/x",
          resetUrl: "http://localhost/reset",
          role: "store_manager",
          summary: "RFQ HVAC",
        },
        "it",
      );
      expect(t.subject).toContain("FacilityFlow");
      expect(t.text.length).toBeGreaterThan(10);
      if (
        id !== "email_verify" &&
        id !== "pm_reminder" &&
        id !== "rfq_invite" &&
        id !== "invite" &&
        id !== "password_reset"
      ) {
        expect(t.html).toContain("T-1");
      }
      if (id === "pm_reminder") expect(t.html).toContain("PV Milano");
      if (id === "rfq_invite") expect(t.html).toContain("Frigo SpA");
      if (id === "invite") expect(t.html).toContain("store_manager");
      if (id === "password_reset") expect(t.html).toContain("reset");
    }
  });

  it("renderizza ticket_nuovo in EN", () => {
    const t = renderEmailTemplate(
      "ticket_nuovo",
      { ticketId: "T-1", storeName: "Milan Store" },
      "en",
    );
    expect(t.subject).toContain("New ticket");
    expect(t.html).toContain("Milan Store");
  });
});
