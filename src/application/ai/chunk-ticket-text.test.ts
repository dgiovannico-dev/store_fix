import { describe, expect, it } from "vitest";
import { chunkTicketText } from "./chunk-ticket-text";

describe("chunkTicketText", () => {
  it("returns empty for blank input", () => {
    expect(chunkTicketText({})).toEqual([]);
  });

  it("chunks long description into max 4 pieces", () => {
    const description = "freddo ".repeat(200);
    const chunks = chunkTicketText({
      category: "hvac",
      description,
      notes: ["nota tecnica compressore"],
    });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.length).toBeLessThanOrEqual(4);
    expect(chunks[0]).toContain("hvac");
  });
});
