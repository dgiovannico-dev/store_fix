import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canAccessStore, scopedStoreIds } from "./store-scope";

describe("store-scope", () => {
  it("HQ vede all; store_manager solo storeIds", () => {
    expect(
      scopedStoreIds({
        role: Role.owner,
        storeIds: [],
        deletedAt: null,
      }),
    ).toBe("all");

    expect(
      scopedStoreIds({
        role: Role.store_manager,
        storeIds: ["s1"],
        deletedAt: null,
      }),
    ).toEqual(["s1"]);

    expect(
      canAccessStore(
        { role: Role.store_manager, storeIds: ["s1"], deletedAt: null },
        "s2",
      ),
    ).toBe(false);

    expect(
      scopedStoreIds({
        role: Role.store_staff,
        storeIds: ["s1"],
        deletedAt: new Date(),
      }),
    ).toBe("none");
  });
});
