import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("web app manifest F2-06", () => {
  it("espone nome IT, standalone e icone 192/512", () => {
    const m = manifest();
    expect(m.name).toBe("FacilityFlow");
    expect(m.short_name).toBe("FacilityFlow");
    expect(m.lang).toBe("it");
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/app");
    expect(m.theme_color).toBe("#2a3a55");
    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });
});
