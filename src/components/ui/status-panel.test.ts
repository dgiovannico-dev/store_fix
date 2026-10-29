import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusPanel } from "./status-panel";

function html(
  props: Parameters<typeof StatusPanel>[0],
): string {
  return renderToStaticMarkup(createElement(StatusPanel, props));
}

describe("StatusPanel US-E10-02", () => {
  it("error → role=alert e titolo custom", () => {
    const out = html({
      kind: "error",
      title: "Credenziali non valide",
      locale: "it",
    });
    expect(out).toContain('role="alert"');
    expect(out).toContain("Credenziali non valide");
  });

  it("empty → role=status e catalogo EN", () => {
    const out = html({ kind: "empty", locale: "en" });
    expect(out).toContain('role="status"');
    expect(out).toContain("No items");
  });

  it("loading → aria-live polite + titolo IT", () => {
    const out = html({ kind: "loading", locale: "it" });
    expect(out).toContain('aria-live="polite"');
    expect(out).toContain("Caricamento…");
  });
});
