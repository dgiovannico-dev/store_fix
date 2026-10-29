export const ALLOWED_ATTACHMENT_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedAttachmentMime = (typeof ALLOWED_ATTACHMENT_MIME)[number];

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

export function assertAllowedUpload(mime: string, sizeBytes: number): void {
  if (!ALLOWED_ATTACHMENT_MIME.includes(mime as AllowedAttachmentMime)) {
    throw new StorageValidationError(
      `MIME non consentito: ${mime}. Consentiti: jpeg, png, webp.`,
    );
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_ATTACHMENT_BYTES) {
    throw new StorageValidationError(
      `Dimensione non valida (max ${MAX_ATTACHMENT_BYTES} bytes).`,
    );
  }
}
