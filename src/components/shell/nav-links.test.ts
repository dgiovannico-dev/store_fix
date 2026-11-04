import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { navLinksForRole, shellAudienceForRole } from "./nav-links";

describe("navLinksForRole / shellAudience (F5-UX-01)", () => {
  it("vendor → phone audience inbox + rfq", () => {
    expect(shellAudienceForRole(Role.vendor)).toBe("vendor");
    const n = navLinksForRole(Role.vendor);
    expect(n.home).toBe("/vendor/inbox");
    expect(n.links.map((l) => l.href)).toEqual([
      "/vendor/inbox",
      "/vendor/rfq",
    ]);
  });

  it("store_manager → phone audience", () => {
    expect(shellAudienceForRole(Role.store_manager)).toBe("store");
    const hrefs = navLinksForRole(Role.store_manager).links.map((l) => l.href);
    expect(hrefs).toContain("/app/tickets");
    expect(hrefs).toContain("/app/tickets/new");
    expect(hrefs.length).toBeLessThanOrEqual(4);
  });

  it("viewer_finance senza store/segnala", () => {
    const hrefs = navLinksForRole(Role.viewer_finance).links.map((l) => l.href);
    expect(hrefs).toContain("/app/dashboard");
    expect(hrefs).toContain("/app/contratti");
    expect(hrefs).not.toContain("/app/stores");
    expect(hrefs).not.toContain("/app/segnala");
  });

  it("owner HQ sidebar include vendors/assets e non segnala in sidebar", () => {
    expect(shellAudienceForRole(Role.owner)).toBe("hq");
    const hrefs = navLinksForRole(Role.owner).links.map((l) => l.href);
    expect(hrefs).toContain("/app/dashboard");
    expect(hrefs).toContain("/app/tickets");
    expect(hrefs).toContain("/app/stores");
    expect(hrefs).toContain("/app/vendors");
    expect(hrefs).toContain("/app/assets");
    expect(hrefs).toContain("/app/rfq");
    expect(hrefs).not.toContain("/app/segnala");
  });
});
