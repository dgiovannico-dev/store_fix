# ADR-0006: Attachments via SeaweedFS (S3 API)

## Status

Accepted

## Date

2026-10-28

## Context

Tickets need photos (store intake, vendor proof on `done`) without storing binaries in Postgres. Paid object stores (R2/S3) are excluded; MinIO community is unsuitable for greenfield 2026. Browser clients need time-limited access; GC of soft-deleted objects can be deferred.

## Decision

Run **SeaweedFS** in Compose with **S3-compatible gateway**. Persist only `Attachment` metadata in Postgres (`storageKey`, mime, size, uploader). Upload/download via **presigned URLs**; MIME allowlist (jpeg/png/webp); max **10MB**. Soft-delete metadata first; object GC optional later. Keys prefixed by `tenantId` for operational clarity (isolation still enforced in app).

## Consequences

- App never streams large files through Node as default path — signed URL to gateway.
- Backup/retention policy for SeaweedFS volumes must be documented (`US-E10-03`).
- Proxy/`externalUrl` settings matter for signature verification in prod ([SeaweedFS S3 API](https://github.com/seaweedfs/seaweedfs/wiki/Amazon-S3-API)).
- Vendor/store can only attach within Membership/ticket scope.

## Alternatives rejected

| Alternative | Perché no |
|-------------|-----------|
| Cloudflare R2 / AWS S3 | Paid SaaS / non-OSS path |
| MinIO community | Archived / not for new 2026 stacks |
| Blobs in Postgres | Bloats DB, backup pain, poor for photo UX |
| Files on local disk of `app` container | Not shared with scale-out; weak durability story |
