import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  hqSidebarItems,
  storeBottomItems,
  vendorBottomItems,
} from "@/components/shell/nav-config";
import {
  hqTourSidebarRoutes,
  stepsForAudience,
} from "./tour-registry";

function firstRoutes(audience: "store" | "vendor"): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of stepsForAudience(audience, "it")) {
    if (!s.route) continue;
    if (seen.has(s.route)) continue;
    seen.add(s.route);
    out.push(s.route);
  }
  return out;
}

describe("product tour vs sidebar order (F8)", () => {
  it("HQ primary tour routes match owner sidebar order", () => {
    const sidebar = hqSidebarItems(Role.owner, "it").map((i) => i.href);
    expect(hqTourSidebarRoutes()).toEqual(sidebar);
  });

  it("store tour routes match bottom nav order", () => {
    const nav = storeBottomItems("it").map((i) => i.href);
    expect(firstRoutes("store")).toEqual(nav);
  });

  it("vendor tour routes match bottom nav order", () => {
    const nav = vendorBottomItems("it").map((i) => i.href);
    expect(firstRoutes("vendor")).toEqual(nav);
  });

  it("every step has non-empty IT title and description (F8-11)", () => {
    for (const audience of ["hq", "store", "vendor"] as const) {
      for (const step of stepsForAudience(audience, "it")) {
        expect(step.title.trim().length, step.id).toBeGreaterThan(3);
        expect(step.description.trim().length, step.id).toBeGreaterThan(40);
      }
    }
  });

  it("HQ tour includes deep chapters (members, audit, scorecard, RFQ new)", () => {
    const ids = stepsForAudience("hq", "it").map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "hq.shell.nav",
        "hq.shell.help",
        "hq.tickets.new",
        "hq.tickets.detail",
        "hq.stores.actions",
        "hq.vendors.scorecard",
        "hq.contracts.performance",
        "hq.calendar.views",
        "hq.chargeback.share",
        "hq.wallboard.qr",
        "hq.rfq.new",
        "hq.settings.members",
        "hq.settings.audit",
      ]),
    );
  });
});
