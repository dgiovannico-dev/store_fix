import { TicketPriority } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { parseInboundEmail } from "./parse-inbound";

describe("parseInboundEmail", () => {
  it("estrae store, categoria frigo e priorità critica", () => {
    const p = parseInboundEmail({
      subject: "[store:PV Milano 1] Frigo critico caldo",
      text: "Temperatura >8C, emergenza",
      from: "staff@negozio.it",
    });
    expect(p.storeHint).toBe("PV Milano 1");
    expect(p.category).toBe("frigo");
    expect(p.priority).toBe(TicketPriority.critical);
    expect(p.description).toContain("Da: staff@negozio.it");
  });

  it("accetta PV: hint nel subject", () => {
    const p = parseInboundEmail({
      subject: "PV: Roma Centro - HVAC rumore",
      text: "Clima rumore forte",
    });
    expect(p.storeHint).toBe("Roma Centro");
    expect(p.category).toBe("hvac");
  });

  it("mappa luce/elettrico a illuminazione (catalogo intake)", () => {
    const p = parseInboundEmail({
      subject: "[store:PV X] Neon spento",
      text: "Quadro elettrico corridoio",
    });
    expect(p.category).toBe("illuminazione");
  });
});
