import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/request-locale", () => ({
  requestLocale: vi.fn(async () => "it" as const),
}));

describe("web app manifest F2-06", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("espone nome, standalone e icone 192/512 (locale richiesta)", async () => {
    const { default: manifest } = await import("./manifest");
    const m = await manifest();
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
