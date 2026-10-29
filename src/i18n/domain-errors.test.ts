import { describe, expect, it } from "vitest";
import { en } from "./en";
import { it as itCatalog } from "./it";
import { domainErrorFor, isDomainErrorKey } from "./domain-errors";

describe("domainErrors catalog", () => {
  it("IT/EN condividono le chiavi", () => {
    expect(Object.keys(itCatalog.domainErrors).sort()).toEqual(
      Object.keys(en.domainErrors).sort(),
    );
  });

  it("resolve sync per locale", () => {
    expect(domainErrorFor("ticketNotFound", "it")).toBe("Ticket non trovato");
    expect(domainErrorFor("ticketNotFound", "en")).toBe("Ticket not found");
    expect(isDomainErrorKey("ticketImmutableVerified")).toBe(true);
    expect(isDomainErrorKey("nope")).toBe(false);
  });

  it("illegalTransition applica params", () => {
    expect(
      domainErrorFor("illegalTransition", "en", {
        from: "open",
        to: "done",
        role: "store_staff",
      }),
    ).toBe("Transition not allowed: open → done (role store_staff)");
  });

  it("export/dashboard codes risolvono IT/EN", () => {
    expect(domainErrorFor("exportGdprForbidden", "it")).toBe(
      "Export GDPR non consentito",
    );
    expect(domainErrorFor("dashboardForbidden", "en")).toBe(
      "Dashboard not allowed",
    );
  });

  it("store/asset/membership codes risolvono IT/EN", () => {
    expect(domainErrorFor("storeNotFound", "it")).toBe(
      "Punto vendita non trovato",
    );
    expect(domainErrorFor("membershipNotFound", "en")).toBe(
      "Membership not found",
    );
    expect(domainErrorFor("vendorNotFound", "en")).toBe("Vendor not found");
  });
});
