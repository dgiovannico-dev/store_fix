export const ALLOWED_ATTACHMENT_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedAttachmentMime = (typeof ALLOWED_ATTACHMENT_MIME)[number];

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB

export type StorageValidationCode =
  | "uploadMimeNotAllowed"
  | "uploadSizeInvalid";

/** EN diagnostics for logs/tests; UI uses `code` (+ params) → domainErrors. */
function storageDiagnostic(
  code: StorageValidationCode,
  params?: Record<string, string>,
): string {
  switch (code) {
    case "uploadMimeNotAllowed":
      return `MIME not allowed: ${params?.mime ?? "?"}`;
    case "uploadSizeInvalid":
      return `Invalid size (max ${params?.maxBytes ?? MAX_ATTACHMENT_BYTES} bytes)`;
  }
}

export class StorageValidationError extends Error {
  readonly code: StorageValidationCode;
  readonly params?: Record<string, string>;

  constructor(code: StorageValidationCode, params?: Record<string, string>) {
    super(storageDiagnostic(code, params));
    this.name = "StorageValidationError";
    this.code = code;
    this.params = params;
  }
}

export function assertAllowedUpload(mime: string, sizeBytes: number): void {
  if (!ALLOWED_ATTACHMENT_MIME.includes(mime as AllowedAttachmentMime)) {
    throw new StorageValidationError("uploadMimeNotAllowed", { mime });
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_ATTACHMENT_BYTES) {
    throw new StorageValidationError("uploadSizeInvalid", {
      maxBytes: String(MAX_ATTACHMENT_BYTES),
    });
  }
}
