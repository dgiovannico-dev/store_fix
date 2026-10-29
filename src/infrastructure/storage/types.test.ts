import { describe, expect, it } from "vitest";
import {
  assertAllowedUpload,
  MAX_ATTACHMENT_BYTES,
  StorageValidationError,
} from "./types";

describe("assertAllowedUpload", () => {
  it("accetta jpeg entro 10MB", () => {
    expect(() => assertAllowedUpload("image/jpeg", 1024)).not.toThrow();
  });

  it("rifiuta mime non in allowlist", () => {
    try {
      assertAllowedUpload("application/pdf", 100);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(StorageValidationError);
      expect((e as StorageValidationError).code).toBe("uploadMimeNotAllowed");
      expect((e as StorageValidationError).params?.mime).toBe("application/pdf");
    }
  });

  it("rifiuta file troppo grandi", () => {
    try {
      assertAllowedUpload("image/png", MAX_ATTACHMENT_BYTES + 1);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(StorageValidationError);
      expect((e as StorageValidationError).code).toBe("uploadSizeInvalid");
    }
  });

  it("rifiuta size zero", () => {
    expect(() => assertAllowedUpload("image/webp", 0)).toThrow(
      StorageValidationError,
    );
  });
});
