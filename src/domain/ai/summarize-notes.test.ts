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
    const parsed = parseOllamaSummaryJson(
      '{"summary":"Intervento frigo chiuso con successo."}',
    );
    expect(parsed?.summary).toMatch(/frigo/i);
  });

  it("legge suggestedSolution", () => {
    const parsed = parseOllamaSummaryJson(
      '{"summary":"Frigo fuori range.","suggestedSolution":"1. Controllare setpoint.\\n2. Chiamare frigorista."}',
    );
    expect(parsed?.suggestedSolution).toMatch(/setpoint/i);
  });
});

describe("summarizeNotesHeuristic solution", () => {
  it("propone passi per frigo", () => {
    const r = summarizeNotesHeuristic(
      "Apertura: frigo banco caldo sopra 8 gradi. Allarme temperatura attivo da stamattina.",
    );
    expect(r.suggestedSolution).toMatch(/temperatura|set-point|vendor/i);
  });
});
