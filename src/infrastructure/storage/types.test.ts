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
    expect(() => assertAllowedUpload("application/pdf", 100)).toThrow(
      StorageValidationError,
    );
  });

  it("rifiuta file troppo grandi", () => {
    expect(() =>
      assertAllowedUpload("image/png", MAX_ATTACHMENT_BYTES + 1),
    ).toThrow(StorageValidationError);
  });

  it("rifiuta size zero", () => {
    expect(() => assertAllowedUpload("image/webp", 0)).toThrow(
      StorageValidationError,
    );
  });
});
