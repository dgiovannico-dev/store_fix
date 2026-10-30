# Backup Postgres + SeaweedFS (US-E10-03)

## Postgres (giornaliero)

Preferire formato custom (`-Fc`) via script:

```bash
npm run db:backup
# → backups/ff-YYYYMMDD-HHMMSS.dump
```

Alternativa SQL gzip:

```bash
docker compose exec -T postgres pg_dump -U facilityflow facilityflow \
  | gzip > "backups/ff-$(date +%Y%m%d).sql.gz"

# Verify restore (staging / clone)
gunzip -c backups/ff-YYYYMMDD.sql.gz | docker compose exec -T postgres \
  psql -U facilityflow -d facilityflow_restore_test
```

Restore drill (`-Fc`):

```bash
docker compose exec -T postgres createdb -U facilityflow facilityflow_restore_test
pg_restore -U facilityflow -d facilityflow_restore_test backups/ff-….dump
# annotare data + esito in Sprint Review
```

Retention consigliata MVP: **14 giorni** dump locali; produzione EU: allineare a retention GDPR (24 mesi verified ≠ dump raw illimitato).

## SeaweedFS

- Allegati soft-deleted restano su volume finché non gira `attachment.gc` (grace default 7g).
- Backup volume: snapshot directory/volume SeaweedFS host o `weed` backup tool — documentare path Compose volume.
- Policy: non cancellare oggetti storage alla soft-delete Attachment.

## Drill

Almeno 1 restore drill per sprint release (S4 exit / E14 prep): annotare sotto.

### Restore drill log

| Date | Environment | Dump | Target DB | Prod touched? | Esito | Note |
|------|-------------|------|-----------|---------------|-------|------|
| 2026-10-29 | Local Compose (`postgres:16-alpine` then; now `16.15-alpine@sha256:…`, DB `facilityflow`) | `npm run db:backup` → `backups/ff-20261029-002050.dump` (`-Fc`) | `facilityflow_restore_test` | **No** | **PASS** | `SELECT COUNT(*) FROM "Ticket"` → 15 (seed pilota). Host `pg_restore -l` può fallire per versione client; usare restore **nel** container. |
| 2026-10-29 | Local Compose | `ff-20261029-010020.dump` — verify list via `pg_restore` **in container** (`pg-backup.sh`) | — | **No** | **PASS** | Fix mismatch Dump 1.15 vs host client; `deploy:migrate:lab` OK |

**Comando sicuro (solo scratch DB):**

```bash
DUMP="$(ls -t backups/ff-*.dump | head -1)"
docker compose exec -T postgres dropdb -U facilityflow --if-exists facilityflow_restore_test
docker compose exec -T postgres createdb -U facilityflow -O facilityflow facilityflow_restore_test
cat "$DUMP" | docker compose exec -T postgres \
  pg_restore -U facilityflow -d facilityflow_restore_test --no-owner --no-acl
docker compose exec -T postgres psql -U facilityflow -d facilityflow_restore_test \
  -c 'SELECT COUNT(*) AS tickets FROM "Ticket";'
docker compose exec -T postgres dropdb -U facilityflow facilityflow_restore_test
```

**Non** eseguire `pg_restore` contro `-d facilityflow` durante il drill.

> **Image pin corrente (lab/prod):** `postgres:16.15-alpine@sha256:0cefaabd…` — vedi [`COMPOSE.md`](./COMPOSE.md).
