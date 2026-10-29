# Allegati ticket — SeaweedFS

## Policy

- Storage: **SeaweedFS** S3 API (`S3_ENDPOINT`, bucket `S3_BUCKET`)
- Nessun blob in Postgres — solo metadata `Attachment`
- MIME allowlist: `image/jpeg`, `image/png`, `image/webp`
- Max size: **10 MB**
- Soft-delete: `Attachment.deletedAt` — oggetto SeaweedFS non eliminato subito
- GC: job pg-boss `attachment.gc` (`0 4 * * *` Europe/Rome) → `DeleteObject` se `deletedAt` oltre grace e `storagePurgedAt` null

| Env | Default | Note |
|-----|---------|------|
| `S3_ENDPOINT` | `http://localhost:8333` | Solo rete interna app/worker → SeaweedFS |
| `S3_PUBLIC_ENDPOINT` | = `S3_ENDPOINT` | Host **firmato** per browser PUT/GET (SigV4). Prod: `https://s3.<FF_DOMAIN>` |
| `ATTACHMENT_GC_GRACE_DAYS` | `7` | Giorni dopo soft-delete prima del DeleteObject |
| `ATTACHMENT_GC_DRY_RUN` | unset | Se `true`, conta candidati senza S3/DB write |

## Signed URL

| Operazione | TTL default | Env |
|------------|-------------|-----|
| PUT / GET  | **900 s** (15 min) | `ATTACHMENT_SIGNED_URL_TTL_SECONDS` |

PUT: `Content-Type` è parte della firma (`signableHeaders`). Il client deve inviare lo stesso MIME.

**Non riscrivere** l’URL dopo `getSignedUrl`: l’host è nella firma. Il client S3 di presign usa `resolveS3Endpoint("presign")` → `S3_PUBLIC_ENDPOINT`.

### Browser / Compose

| Ambiente | `S3_PUBLIC_ENDPOINT` | Reachability |
|----------|----------------------|--------------|
| Dev locale | spesso = `S3_ENDPOINT` | SeaweedFS su `localhost:8333` |
| Lab (`compose.lab`) | default `http://127.0.0.1:8333` | porta pubblicata sul host |
| Prod / staging | `https://s3.<FF_DOMAIN>` | Caddy site `s3.{$FF_DOMAIN}` + DNS; `WEED_S3_EXTERNAL_URL` allineato |

Smoke lab (presign → PUT su host pubblico → confirm):

```bash
# compose.prod + compose.lab up, npm run storage:init, npm run db:seed:pilot, app su :3000
npm run smoke:attachment-put
# opz: SMOKE_TICKET_ID=… S3_PUBLIC_ENDPOINT=http://127.0.0.1:8333
```

Exit `SKIP` (0) se app/S3 assenti; `FAIL` (1) se PUT/host SigV4 non allineati. **Non** in CI (niente SeaweedFS sul runner).

## Flusso

1. `POST /api/tickets/:id/attachments/presign` — MIME/size + scope → signed PUT (host pubblico)
2. Client PUT diretto a SeaweedFS (via pubblico) con lo stesso `Content-Type`
3. `POST /api/tickets/:id/attachments/confirm` → row `Attachment`
4. `GET /api/tickets/:id/attachments/:attachmentId/url` → signed GET (scope)
