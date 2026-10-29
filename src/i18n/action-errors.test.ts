import { describe, expect, it } from "vitest";
import { en } from "./en";
import { it as itCatalog } from "./it";

describe("actionErrors catalog", () => {
  it("IT/EN condividono le stesse chiavi guard", () => {
    expect(Object.keys(itCatalog.actionErrors).sort()).toEqual(
      Object.keys(en.actionErrors).sort(),
    );
    expect(itCatalog.actionErrors.accessRequired).toBe("Accesso richiesto");
    expect(en.actionErrors.accessRequired).toBe("Sign-in required");
  });
});
