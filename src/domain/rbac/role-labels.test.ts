import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { roleLabel } from "./role-labels";

describe("roleLabel", () => {
  it("mappa ruoli IT/EN e fallback", () => {
    expect(roleLabel(Role.owner)).toMatch(/Owner|Proprietario/i);
    expect(roleLabel(Role.ops_coordinator, "en")).toMatch(/Ops/i);
    expect(roleLabel(Role.store_staff, "it")).toMatch(/Store|Negozio|Staff/i);
    expect(roleLabel("legacy_xyz")).toBe("legacy_xyz");
  });
});
