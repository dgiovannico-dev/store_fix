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

export class StorageValidationError extends Error {
  readonly code: StorageValidationCode;
  readonly params?: Record<string, string>;

  constructor(
    message: string,
    code: StorageValidationCode,
    params?: Record<string, string>,
  ) {
    super(message);
    this.name = "StorageValidationError";
    this.code = code;
    this.params = params;
  }
}

export function assertAllowedUpload(mime: string, sizeBytes: number): void {
  if (!ALLOWED_ATTACHMENT_MIME.includes(mime as AllowedAttachmentMime)) {
    // Diagnostic EN for logs/tests; UI uses `code` + domainErrors
    throw new StorageValidationError(
      `MIME not allowed: ${mime}`,
      "uploadMimeNotAllowed",
      { mime },
    );
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_ATTACHMENT_BYTES) {
    throw new StorageValidationError(
      `Invalid size (max ${MAX_ATTACHMENT_BYTES} bytes)`,
      "uploadSizeInvalid",
      { maxBytes: String(MAX_ATTACHMENT_BYTES) },
    );
  }
}
