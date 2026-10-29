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
      expect((e as CompleteWorkError).message).not.toMatch(/foto|chiudere/i);
    }
  });

  it("fail mime non immagine", () => {
    try {
      assertCompleteWorkReady({
        attachments: [{ mime: "application/pdf" }],
        actualCost: 10,
        completionReport: "Fatto ok",
      });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CompleteWorkError);
      expect((e as CompleteWorkError).code).toBe("completeWorkPhotoRequired");
    }
  });

  it("fail costo mancante o zero", () => {
    try {
      assertCompleteWorkReady({
        attachments: [okPhoto],
        actualCost: null,
        completionReport: "Fatto ok",
      });
      expect.unreachable();
    } catch (e) {
      expect((e as CompleteWorkError).code).toBe("actualCostRequired");
    }
    try {
      assertCompleteWorkReady({
        attachments: [okPhoto],
        actualCost: 0,
        completionReport: "Fatto ok",
      });
      expect.unreachable();
    } catch (e) {
      expect((e as CompleteWorkError).code).toBe("actualCostMustBePositive");
    }
  });

  it("fail report corto", () => {
    try {
      assertCompleteWorkReady({
        attachments: [okPhoto],
        actualCost: 1,
        completionReport: "ok",
      });
      expect.unreachable();
    } catch (e) {
      expect((e as CompleteWorkError).code).toBe("workReportRequired");
    }
  });
});
