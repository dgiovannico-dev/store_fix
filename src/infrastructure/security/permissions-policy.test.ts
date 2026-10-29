import { describe, expect, it } from "vitest";
import {
  buildPermissionsPolicyHeader,
  PERMISSIONS_POLICY_DENY_FEATURES,
} from "./permissions-policy";

describe("buildPermissionsPolicyHeader", () => {
  it("nega payment, usb, browsing-topics, attribution-reporting, hid", () => {
    const h = buildPermissionsPolicyHeader();
    expect(h).toContain("payment=()");
    expect(h).toContain("usb=()");
    expect(h).toContain("browsing-topics=()");
    expect(h).toContain("interest-cohort=()");
    expect(h).toContain("attribution-reporting=()");
    expect(h).toContain("bluetooth=()");
    expect(h).toContain("hid=()");
    expect(h).toContain("serial=()");
    expect(h).not.toMatch(/clipboard/);
  });

  it("include tutte le feature del catalogo deny", () => {
    const h = buildPermissionsPolicyHeader();
    for (const f of PERMISSIONS_POLICY_DENY_FEATURES) {
      expect(h).toContain(`${f}=()`);
    }
  });
});
