# Allegati ticket — SeaweedFS

## Policy

- Storage: **SeaweedFS** S3 API (`S3_ENDPOINT`, bucket `S3_BUCKET`)
- Nessun blob in Postgres — solo metadata `Attachment`
- MIME allowlist: `image/jpeg`, `image/png`, `image/webp`
- Max size: **10 MB**
- Soft-delete: `Attachment.deletedAt` — oggetto SeaweedFS non eliminato subito (GC futuro)

## Signed URL

| Operazione | TTL default | Env |
|------------|-------------|-----|
| PUT / GET  | **900 s** (15 min) | `ATTACHMENT_SIGNED_URL_TTL_SECONDS` |

PUT: `Content-Type` è parte della firma (`signableHeaders`). Il client deve inviare lo stesso MIME.

## Flusso

1. `POST /api/tickets/:id/attachments/presign` — MIME/size + scope → signed PUT
2. Client PUT diretto a SeaweedFS con lo stesso `Content-Type`
3. `POST /api/tickets/:id/attachments/confirm` → row `Attachment`
4. `GET /api/tickets/:id/attachments/:attachmentId/url` → signed GET (scope)
