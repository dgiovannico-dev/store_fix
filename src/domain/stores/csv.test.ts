import { describe, expect, it } from "vitest";
import { parseCsv, rowsToObjects } from "./csv";

describe("parseCsv", () => {
  it("gestisce header e campi quotati", () => {
    const text = `nome,citta\n"PV, Centro",Milano\n`;
    const { headers, records } = rowsToObjects(parseCsv(text));
    expect(headers).toEqual(["nome", "citta"]);
    expect(records[0]).toEqual({ nome: "PV, Centro", citta: "Milano" });
  });
});
