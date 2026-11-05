import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { forbiddenAppPathRedirect } from "./route-audience";

describe("forbiddenAppPathRedirect", () => {
  it("vendor cannot open HQ /app stores (data leak guard)", () => {
    expect(forbiddenAppPathRedirect(Role.vendor, "/app/stores")).toBe(
      "/vendor/inbox",
    );
    expect(forbiddenAppPathRedirect(Role.vendor, "/app/tickets")).toBe(
      "/vendor/inbox",
    );
    expect(forbiddenAppPathRedirect(Role.vendor, "")).toBe("/vendor/inbox");
    expect(forbiddenAppPathRedirect(Role.vendor, "/vendor/inbox")).toBeNull();
  });

  it("store cannot open HQ dashboard / vendors", () => {
    expect(
      forbiddenAppPathRedirect(Role.store_manager, "/app/dashboard"),
    ).toBe("/app/tickets");
    expect(forbiddenAppPathRedirect(Role.store_manager, "/app/vendors")).toBe(
      "/app/tickets",
    );
    expect(
      forbiddenAppPathRedirect(Role.store_manager, "/app/settings/locale"),
    ).toBeNull();
    expect(
      forbiddenAppPathRedirect(Role.store_manager, "/app/tickets/new"),
    ).toBeNull();
  });

  it("viewer_finance stays on finance surface", () => {
    expect(
      forbiddenAppPathRedirect(Role.viewer_finance, "/app/stores"),
    ).toBe("/app/dashboard");
    expect(
      forbiddenAppPathRedirect(Role.viewer_finance, "/app/settings/ai"),
    ).toBe("/app/dashboard");
    expect(
      forbiddenAppPathRedirect(Role.viewer_finance, "/app/finance/chargeback"),
    ).toBeNull();
    expect(
      forbiddenAppPathRedirect(Role.viewer_finance, "/app/contratti"),
    ).toBeNull();
  });

  it("owner keeps full /app", () => {
    expect(forbiddenAppPathRedirect(Role.owner, "/app/stores")).toBeNull();
    expect(forbiddenAppPathRedirect(Role.owner, "/vendor/inbox")).toBe(
      "/app/dashboard",
    );
  });
});
