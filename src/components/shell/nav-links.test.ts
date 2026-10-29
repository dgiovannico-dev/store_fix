import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { navLinksForRole } from "./nav-links";

describe("navLinksForRole", () => {
  it("vendor inbox + rfq", () => {
    const n = navLinksForRole(Role.vendor);
    expect(n.home).toBe("/vendor/inbox");
    expect(n.links.map((l) => l.href)).toEqual([
      "/vendor/inbox",
      "/vendor/rfq",
    ]);
  });

  it("viewer_finance senza store/segnala", () => {
    const hrefs = navLinksForRole(Role.viewer_finance).links.map((l) => l.href);
    expect(hrefs).toContain("/app/dashboard");
    expect(hrefs).toContain("/app/contratti");
    expect(hrefs).not.toContain("/app/stores");
    expect(hrefs).not.toContain("/app/segnala");
  });

  it("owner ha dashboard ticket store contratti calendario segnala rfq + lingua", () => {
    const hrefs = navLinksForRole(Role.owner).links.map((l) => l.href);
    expect(hrefs).toEqual([
      "/app/dashboard",
      "/app/tickets",
      "/app/stores",
      "/app/contratti",
      "/app/calendario",
      "/app/segnala",
      "/app/rfq",
      "/app/settings/locale",
    ]);
  });
});
