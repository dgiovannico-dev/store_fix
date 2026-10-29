import { describe, expect, it } from "vitest";
import {
  parseOllamaSummaryJson,
  summarizeNotesHeuristic,
} from "./summarize-notes";

describe("summarizeNotesHeuristic", () => {
  it("estrae bullet da note lunghe", () => {
    const text = [
      "Apertura: frigo banco caldo sopra 8 gradi.",
      "Vendor arrivato, ricarica gas effettuata.",
      "Verifica store: temperatura ok dopo 2 ore.",
    ].join(" ");
    const r = summarizeNotesHeuristic(text, 3);
    expect(r.source).toBe("heuristic");
    expect(r.bulletCount).toBeGreaterThanOrEqual(1);
    expect(r.summary).toMatch(/^•/);
  });

  it("gestisce testo troppo corto", () => {
    const r = summarizeNotesHeuristic("ok");
    expect(r.bulletCount).toBe(0);
  });
});

describe("parseOllamaSummaryJson", () => {
  it("legge summary JSON", () => {
    expect(
      parseOllamaSummaryJson('{"summary":"Intervento frigo chiuso con successo."}'),
    ).toMatch(/frigo/i);
  });
});
