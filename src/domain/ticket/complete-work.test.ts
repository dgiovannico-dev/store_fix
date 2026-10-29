import { describe, expect, it } from "vitest";
import { assertCompleteWorkReady, CompleteWorkError } from "./complete-work";

describe("assertCompleteWorkReady", () => {
  const okPhoto = { mime: "image/jpeg", deletedAt: null };

  it("happy path", () => {
    const r = assertCompleteWorkReady({
      attachments: [okPhoto],
      actualCost: 120.5,
      completionReport: "Sostituito compressore",
    });
    expect(r.actualCost).toBe(120.5);
    expect(r.completionReport).toContain("compressore");
  });

  it("fail senza foto", () => {
    try {
      assertCompleteWorkReady({
        attachments: [],
        actualCost: 10,
        completionReport: "Fatto",
      });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CompleteWorkError);
      expect((e as CompleteWorkError).code).toBe("completeWorkPhotoRequired");
    }
  });

  it("fail mime non immagine", () => {
    expect(() =>
      assertCompleteWorkReady({
        attachments: [{ mime: "application/pdf" }],
        actualCost: 10,
        completionReport: "Fatto ok",
      }),
    ).toThrow(/foto/);
  });

  it("fail costo mancante o zero", () => {
    expect(() =>
      assertCompleteWorkReady({
        attachments: [okPhoto],
        actualCost: null,
        completionReport: "Fatto ok",
      }),
    ).toThrow(/Costo/);
    expect(() =>
      assertCompleteWorkReady({
        attachments: [okPhoto],
        actualCost: 0,
        completionReport: "Fatto ok",
      }),
    ).toThrow(/maggiore/);
  });

  it("fail report corto", () => {
    expect(() =>
      assertCompleteWorkReady({
        attachments: [okPhoto],
        actualCost: 1,
        completionReport: "ok",
      }),
    ).toThrow(/Report/);
  });
});
