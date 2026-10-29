import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { assertAllowedUpload } from "./types";

function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

/**
 * Endpoint S3 per client AWS SDK.
 * - `internal`: app/worker → SeaweedFS in rete Compose (`S3_ENDPOINT`)
 * - `presign`: URL firmate per il browser — `S3_PUBLIC_ENDPOINT` se impostato
 *   (SigV4 include l'host: firmare sul pubblico, non riscrivere dopo).
 */
export function resolveS3Endpoint(
  kind: "internal" | "presign" = "internal",
): string {
  const internal = (
    process.env.S3_ENDPOINT ?? "http://localhost:8333"
  ).replace(/\/$/, "");
  if (kind === "internal") return internal;
  const pub = process.env.S3_PUBLIC_ENDPOINT?.trim().replace(/\/$/, "");
  return pub || internal;
}

export function createS3Client(
  kind: "internal" | "presign" = "internal",
): S3Client {
  return new S3Client({
    endpoint: resolveS3Endpoint(kind),
    region: env("S3_REGION", "us-east-1"),
    credentials: {
      accessKeyId: env("S3_ACCESS_KEY", "admin"),
      secretAccessKey: env("S3_SECRET_KEY", "admin"),
    },
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") === "true",
  });
}

export function attachmentsBucket(): string {
  return env("S3_BUCKET", "facilityflow-attachments");
}

export function signedUrlTtlSeconds(): number {
  return Number(process.env.ATTACHMENT_SIGNED_URL_TTL_SECONDS ?? "900");
}

/** TTL signed GET documentato: default 900s (15 min). */
export async function ensureBucket(client = createS3Client()): Promise<void> {
  const Bucket = attachmentsBucket();
  try {
    await client.send(new HeadBucketCommand({ Bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket }));
  }
}

export async function putAttachmentObject(input: {
  key: string;
  body: Buffer | Uint8Array;
  mime: string;
  client?: S3Client;
}): Promise<{ key: string; sizeBytes: number }> {
  const sizeBytes = input.body.byteLength;
  assertAllowedUpload(input.mime, sizeBytes);
  const client = input.client ?? createS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: attachmentsBucket(),
      Key: input.key,
      Body: input.body,
      ContentType: input.mime,
    }),
  );
  return { key: input.key, sizeBytes };
}

export async function getSignedGetUrl(
  key: string,
  client = createS3Client("presign"),
): Promise<{ url: string; expiresIn: number }> {
  const expiresIn = signedUrlTtlSeconds();
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: attachmentsBucket(), Key: key }),
    { expiresIn },
  );
  return { url, expiresIn };
}

/**
 * Signed PUT con ContentType nella firma (T2.9).
 * Client deve inviare lo stesso header Content-Type.
 */
export async function getSignedPutUrl(input: {
  key: string;
  mime: string;
  sizeBytes: number;
  client?: S3Client;
}): Promise<{ url: string; expiresIn: number; key: string }> {
  assertAllowedUpload(input.mime, input.sizeBytes);
  const expiresIn = signedUrlTtlSeconds();
  const client = input.client ?? createS3Client("presign");
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: attachmentsBucket(),
      Key: input.key,
      ContentType: input.mime,
    }),
    {
      expiresIn,
      signableHeaders: new Set(["content-type"]),
    },
  );
  return { url, expiresIn, key: input.key };
}

export function buildAttachmentKey(input: {
  tenantId: string;
  ticketId: string;
  filename: string;
}): string {
  const safe = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `tenants/${input.tenantId}/tickets/${input.ticketId}/${Date.now()}-${safe}`;
}

/**
 * Hard-delete oggetto SeaweedFS (S3 DeleteObject).
 * Idempotente lato S3: chiave assente → 204, non errore.
 */
export async function deleteAttachmentObject(
  key: string,
  client = createS3Client(),
): Promise<void> {
  await client.send(
    new DeleteObjectCommand({
      Bucket: attachmentsBucket(),
      Key: key,
    }),
  );
}
